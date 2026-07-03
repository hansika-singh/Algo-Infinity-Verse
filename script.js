// ============================================
// UTILITY FUNCTIONS (Memoization & Debounce)
// ============================================
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// ============================================
// ABORT MANAGER
// ============================================
class AbortManager {
  constructor() {
    this.controllers = new Map();
  }
  getSignal(key) {
    if (this.controllers.has(key)) {
      this.controllers.get(key).abort();
    }
    const controller = new AbortController();
    this.controllers.set(key, controller);
    return controller.signal;
  }
  clearSignal(key) {
    this.controllers.delete(key);
  }
}

const apiAbort = new AbortManager();

// ============================================
// CACHE MANAGER (IndexedDB)
// ============================================
class CacheManager {
  constructor(dbName = 'AlgoInfinityCache', storeName = 'api_responses') {
    this.dbName = dbName;
    this.storeName = storeName;
    this.dbPromise = this.initDB();
  }

  initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'url' });
        }
      };
    });
  }

  async set(url, data, type = 'json', ttlMs = 3600000) {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        const record = {
          url,
          data,
          type,
          expiresAt: Date.now() + ttlMs,
          updatedAt: Date.now()
        };
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn("Cache set error:", e);
    }
  }

  async get(url) {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const req = store.get(url);
        req.onsuccess = () => {
          const record = req.result;
          if (!record) return resolve(null);
          if (Date.now() > record.expiresAt) {
            this.invalidate(url);
            return resolve(null);
          }
          resolve(record);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn("Cache get error:", e);
      return null;
    }
  }

  async invalidate(url) {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        const req = store.delete(url);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn("Cache invalidate error:", e);
    }
  }

  async fetchWithCache(url, options = {}, ttlMs = 3600000, type = 'json') {
    const cached = await this.get(url);
    
    const doFetch = async () => {
      try {
        const resp = await fetch(url, options);
        if (!resp.ok) throw new Error('Network response was not ok');
        const data = type === 'json' ? await resp.json() : await resp.text();
        await this.set(url, data, type, ttlMs);
        return data;
      } catch (e) {
        if (e.name === 'AbortError') throw e;
        console.warn(`CacheManager fetch failed for ${url}:`, e);
        if (cached) return cached.data;
        throw e;
      }
    };

    if (cached) {
      const age = Date.now() - cached.updatedAt;
      if (age > ttlMs / 2) {
        doFetch().catch(e => {
          if (e.name !== 'AbortError') console.warn('Background revalidate failed:', e);
        });
      }
      return cached.data;
    }

    return await doFetch();
  }
}

const apiCache = new CacheManager();

// ============================================
// PARTIAL LOADER
// ============================================
function getPartialsBase() {
  const scripts = document.getElementsByTagName('script');
  for (let s of scripts) {
    if (s.src && s.src.includes('script.js')) {
      const idx = s.src.lastIndexOf('/');
      return s.src.substring(0, idx) + '/partials';
    }
  }
  return 'partials';
}

const PARTIALS_VERSION = 1;

async function loadPartial(id, url) {
  const abortKey = `partial_${id}`;
  try {
    const signal = apiAbort.getSignal(abortKey);
    const base = getPartialsBase();
    const filename = url.replace(/^\/?partials\//, '');
    const fetchUrl = base + '/' + filename;
    const versionedUrl = fetchUrl + '?v=' + PARTIALS_VERSION;
    
    const html = await apiCache.fetchWithCache(versionedUrl, { signal }, 86400000, 'text');
    
    document.getElementById(id).innerHTML = html;
    handleActiveNav();
  } catch (e) {
    if (e.name !== 'AbortError') {
      console.warn('Could not load partial:', url);
    }
  } finally {
    apiAbort.clearSignal(abortKey);
  }
}

function handleActiveNav() {
  const currentPage = document.body.dataset.page;
  if (!currentPage) return;
  const pageRegex = new RegExp('/' + currentPage + '\\.html(?:#|$)');
  document.querySelectorAll('.dropdown-item').forEach(link => {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href && pageRegex.test(href));
  });
}

window.addEventListener("load", () => {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.ctrlKey) {
      if (document.activeElement.tagName === "TEXTAREA") {
        e.stopPropagation();
      }
    }
  });
});

// ============================================
// QUIZ DATA
// ============================================
const quizQuestions = {
  arrays: [
    { id: "arrays-1", question: "What is the time complexity of accessing an element in an array by index?", options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"], correct: 0, explanation: "Arrays provide O(1) random access because elements are stored contiguously in memory." },
    { id: "arrays-2", question: "Which of the following is NOT a characteristic of arrays?", options: ["Fixed size (in static arrays)", "O(1) access time", "Elements must be of different types", "Contiguous memory allocation"], correct: 2, explanation: "In arrays, all elements must be of the same type." },
    { id: "arrays-3", question: "What is the time complexity of inserting an element at the beginning of an array?", options: ["O(1)", "O(n)", "O(log n)", "O(1)"], correct: 1, explanation: "Inserting at the beginning requires shifting all existing elements, which is O(n)." },
    { id: "arrays-4", question: "Which technique is commonly used to find the maximum subarray sum?", options: ["Binary Search", "Kadane's Algorithm", "Two Pointers", "Dynamic Programming only"], correct: 1, explanation: "Kadane's Algorithm efficiently finds maximum subarray sum in O(n) time." },
    { id: "arrays-5", question: "What does the 'Two Sum' problem typically ask for?", options: ["Find two numbers that multiply to target", "Find two numbers that sum to target", "Find all pairs in array", "Find the two largest numbers"], correct: 1, explanation: "Two Sum asks: given an array and target, return indices of two numbers that add up to the target." },
    { id: "arrays-6", question: "Which data structure is often used to solve Two Sum in O(n) time?", options: ["Stack", "Queue", "Hash Map", "Linked List"], correct: 2, explanation: "A hash map stores values and their indices for O(1) lookups." },
    { id: "arrays-7", question: "What is the space complexity of a static array of size n?", options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"], correct: 1, explanation: "Static array uses O(n) space to store n elements." },
    { id: "arrays-8", question: "Which problem involves rotating an array elements to the right by k steps?", options: ["Reverse Words", "Rotate Array", "Shift Elements", "Circular Buffer"], correct: 1, explanation: "The 'Rotate Array' problem asks to shift elements right by k positions." },
    { id: "arrays-9", question: "What is the time complexity of merging two sorted arrays of sizes m and n?", options: ["O(1)", "O(max(m,n))", "O(m+n)", "O(m*n)"], correct: 2, explanation: "Merging two sorted arrays takes O(m+n) time." },
    { id: "arrays-10", question: "Which technique uses three pointers to solve 'Sort Colors' (Dutch National Flag) problem?", options: ["Sliding Window", "Two Pointers", "Three Pointers", "Flood Fill"], correct: 2, explanation: "Dutch National Flag algorithm uses three pointers (low, mid, high)." },
  ],
  strings: [
    { id: "strings-1", question: "What is the time complexity of checking if two strings are equal?", options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"], correct: 1, explanation: "String comparison requires checking each character, making it O(n)." },
    { id: "strings-2", question: "Which algorithm is used for pattern matching in strings?", options: ["Dijkstra", "KMP (Knuth-Morris-Pratt)", "Floyd-Warshall", "Kruskal"], correct: 1, explanation: "KMP algorithm efficiently finds occurrences of a pattern in text in O(n+m) time." },
    { id: "strings-3", question: "What data structure is ideal for checking balanced parentheses?", options: ["Queue", "Stack", "Heap", "Hash Set"], correct: 1, explanation: "Stack's LIFO property perfectly matches parentheses matching." },
    { id: "strings-4", question: "What is the space complexity of generating all substrings of a string of length n?", options: ["O(1)", "O(n)", "O(n^2)", "O(2^n)"], correct: 2, explanation: "A string of length n has n(n+1)/2 substrings, which is O(n^2) space." },
    { id: "strings-5", question: "Which technique is used to find the longest substring without repeating characters?", options: ["Dynamic Programming", "Sliding Window", "Binary Search", "Recursion"], correct: 1, explanation: "Sliding window with a hash set tracks unique characters." },
    { id: "strings-6", question: "What does 'palindrome' mean for a string?", options: ["All characters unique", "Reads same forwards and backwards", "Contains only vowels", "All characters uppercase"], correct: 1, explanation: "A palindrome reads the same forwards and backwards." },
    { id: "strings-7", question: "Which operation on strings typically takes O(n) time in JavaScript?", options: ["Char access by index", "Concatenation", "Slicing", "Finding substring"], correct: 3, explanation: "Finding a substring (indexOf, includes) requires scanning, which is O(n)." },
    { id: "strings-8", question: "What is 'anagram' detection about?", options: ["Checking palindrome", "Checking if two strings have same characters in any order", "Finding longest substring", "Reversing string"], correct: 1, explanation: "Anagrams have the same characters with same frequencies but in different orders." },
    { id: "strings-9", question: "Which character encoding is commonly used in modern JavaScript strings?", options: ["ASCII only", "UTF-16", "UTF-8", "Unicode (UTF-16 variations)"], correct: 3, explanation: "JavaScript uses UCS-2/UTF-16 encoding." },
    { id: "strings-10", question: "What is the best approach to check if a string is a valid number (like parseInt validation)?", options: ["Regular Expressions", "Try-catch with Number()", "Manual character iteration", "String methods only"], correct: 0, explanation: "Regular expressions can pattern-match numeric formats efficiently." },
  ],
  linkedlist: [
    { id: "linkedlist-1", question: "What is the primary disadvantage of a singly linked list compared to an array?", options: ["Memory usage", "Random access time", "Insertion time", "Deletion time"], correct: 1, explanation: "Linked lists require O(n) time to access an element by index." },
    { id: "linkedlist-2", question: "What is the time complexity of inserting at the head of a singly linked list?", options: ["O(1)", "O(n)", "O(log n)", "O(1)"], correct: 0, explanation: "Insertion at head only requires updating a couple of pointers: O(1)." },
    { id: "linkedlist-3", question: "Which pointer(s) does a doubly linked list node contain?", options: ["Next only", "Prev only", "Both next and prev", "Neither"], correct: 2, explanation: "Doubly linked list nodes have pointers to both next and previous nodes." },
    { id: "linkedlist-4", question: "How do you detect a cycle in a linked list efficiently?", options: ["Hash set visited nodes", "Floyd's Tortoise and Hare", "Count nodes", "Reverse the list"], correct: 1, explanation: "Floyd's cycle detection (fast and slow pointers) uses O(1) space and O(n) time." },
    { id: "linkedlist-5", question: "What is the time complexity of reversing a singly linked list?", options: ["O(1)", "O(n)", "O(n^2)", "O(log n)"], correct: 1, explanation: "Reversing a linked list requires traversing all n nodes once." },
    { id: "linkedlist-6", question: "Which problem asks to find the nth node from the end of a linked list?", options: ["Find middle node", "Remove duplicates", "Find nth from end", "Reverse list"], correct: 2, explanation: '"Nth node from the end" is solved using two pointers with a gap of n.' },
    { id: "linkedlist-7", question: "In a circular linked list, the last node points to:", options: ["null", "First node", "Middle node", "Any random node"], correct: 1, explanation: "Circular linked list's last node connects back to the first." },
    { id: "linkedlist-8", question: "What is the space complexity of merging two sorted linked lists?", options: ["O(1)", "O(n+m)", "O(log n)", "O(n)"], correct: 0, explanation: "Merging sorted linked lists can be done by rearranging pointers, using O(1) extra space." },
    { id: "linkedlist-9", question: "Which technique is used to find the intersection point of two linked lists?", options: ["Hash set", "Two pointers with length difference", "Recursion", "Stack"], correct: 1, explanation: "Find lengths, advance longer list by difference, then move both pointers together." },
    { id: "linkedlist-10", question: "What is a sentinel/dummy node used for in linked list problems?", options: ["Store extra data", "Simplify edge cases", "Increase speed", "Reduce memory"], correct: 1, explanation: "Dummy nodes avoid handling head/tail edge cases separately." },
  ],
  trees: [
    { id: "trees-1", question: "What is the maximum number of children a binary tree node can have?", options: ["1", "2", "3", "Unlimited"], correct: 1, explanation: "Binary tree nodes have at most two children: left and right." },
    { id: "trees-2", question: "What is the time complexity of searching in a balanced BST?", options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"], correct: 2, explanation: "Balanced BSTs maintain O(log n) height." },
    { id: "trees-3", question: "Which traversal visits nodes in the order: Left → Root → Right?", options: ["Pre-order", "In-order", "Post-order", "Level-order"], correct: 1, explanation: "In-order traversal processes left subtree, then root, then right subtree." },
    { id: "trees-4", question: "What property must a Binary Search Tree (BST) satisfy?", options: ["All left descendants ≤ node < all right descendants", "All levels fully filled", "No cycles", "All nodes have two children"], correct: 0, explanation: "BST invariant: left subtree values ≤ node value < right subtree values." },
    { id: "trees-5", question: "How do you find the height of a binary tree?", options: ["Count nodes", "Max depth from root to leaf", "Count leaf nodes", "Balance factor"], correct: 1, explanation: "Tree height is the number of edges on the longest path from root to leaf." },
    { id: "trees-6", question: "What is the Lowest Common Ancestor (LCA) of two nodes?", options: ["Deepest node common to both root paths", "Smallest value node", "First common parent", "Root node"], correct: 0, explanation: "LCA is the deepest node that is an ancestor of both nodes." },
    { id: "trees-7", question: "Which tree traversal uses a queue?", options: ["DFS", "BFS (Level-order)", "In-order", "Pre-order"], correct: 1, explanation: "Breadth-First Search (Level-order) uses a queue." },
    { id: "trees-8", question: "What is a complete binary tree?", options: ["All levels fully filled except possibly last, left-aligned", "All nodes have two children", "Perfectly balanced", "Sorted values"], correct: 0, explanation: "Complete binary tree has all levels filled except last, and nodes are as far left as possible." },
    { id: "trees-9", question: "Which tree is used to implement a priority queue efficiently?", options: ["Binary Tree", "BST", "Heap", "Trie"], correct: 2, explanation: "Heaps provide O(log n) insert and extract-max/min operations." },
    { id: "trees-10", question: "What does it mean for a tree to be 'balanced'?", options: ["All leaf nodes at same level", "Height difference of subtrees ≤ 1 for every node", "No cycles", "All nodes have 0 or 2 children"], correct: 1, explanation: "Balanced tree means heights of left/right subtrees differ by at most 1." },
  ],
  graphs: [
    { id: "graphs-1", question: "What are the two main ways to represent a graph?", options: ["Matrix and Vector", "Adjacency List and Adjacency Matrix", "Edge list and Tree", "DFS and BFS"], correct: 1, explanation: "Adjacency list and adjacency matrix are standard representations." },
    { id: "graphs-2", question: "Which algorithm finds shortest path on unweighted graphs?", options: ["DFS", "BFS", "Dijkstra", "Bellman-Ford"], correct: 1, explanation: "BFS explores nodes level by level, finding shortest path in unweighted graphs." },
    { id: "graphs-3", question: "What is a directed graph?", options: ["Edges have no direction", "Edges have direction", "Edges are weighted", "Edges are undirected"], correct: 1, explanation: "Directed graphs have edges with direction." },
    { id: "graphs-4", question: "What is a cycle in a graph?", options: ["Path from node to itself", "Tree structure", "Path visiting all nodes", "Disconnected component"], correct: 0, explanation: "A cycle is a path that starts and ends at the same vertex." },
    { id: "graphs-5", question: "Which algorithm detects cycles in a directed graph?", options: ["BFS", "DFS with recursion stack", "Dijkstra", "Kruskal"], correct: 1, explanation: "DFS tracks recursion stack to detect back edges." },
    { id: "graphs-6", question: "What is topological sort used for?", options: ["Shortest path", "Task scheduling with dependencies", "Cycle detection", "Finding connected components"], correct: 1, explanation: "Topological sort orders tasks so each comes before its dependencies." },
    { id: "graphs-7", question: "Which data structure does Dijkstra's algorithm use?", options: ["Stack", "Queue", "Priority Queue / Min-Heap", "Hash Set"], correct: 2, explanation: "Dijkstra uses a min-heap to expand the node with smallest tentative distance." },
    { id: "graphs-8", question: "What is a 'connected component' in an undirected graph?", options: ["Single node", "Maximal set where every pair connected by path", "Complete subgraph", "Tree structure"], correct: 1, explanation: "Connected component is a maximal set of nodes where each node is reachable from every other." },
    { id: "graphs-9", question: "Which algorithm finds the Minimum Spanning Tree (MST)?", options: ["Dijkstra", "Prim's or Kruskal's", "Bellman-Ford", "Floyd-Warshall"], correct: 1, explanation: "Prim's and Kruskal's algorithms both find MST." },
    { id: "graphs-10", question: "What is the time complexity of BFS on a graph with V vertices and E edges using adjacency list?", options: ["O(V)", "O(E)", "O(V + E)", "O(V * E)"], correct: 2, explanation: "BFS visits every vertex once and explores every edge once: O(V + E)." },
  ],
  dp: [
    { id: "dp-1", question: "What are the two key properties needed for Dynamic Programming?", options: ["Greedy and Divide & Conquer", "Optimal substructure and overlapping subproblems", "Recursion and memoization", "Iteration and base cases"], correct: 1, explanation: "DP requires optimal substructure and overlapping subproblems." },
    { id: "dp-2", question: "What is memoization in DP?", options: ["Bottom-up tabulation", "Top-down caching of results", "Greedy choice", "Iterative approach"], correct: 1, explanation: "Memoization stores results of expensive function calls to avoid recomputation." },
    { id: "dp-3", question: "What is tabulation in DP?", options: ["Top-down recursive memoization", "Bottom-up iterative table filling", "Greedy approach", "Divide and conquer"], correct: 1, explanation: "Tabulation builds DP table iteratively from base cases upward." },
    { id: "dp-4", question: "The Fibonacci sequence can be computed using DP in what time complexity?", options: ["O(2^n) naive recursion", "O(n) DP", "O(log n)", "O(1)"], correct: 1, explanation: "DP Fibonacci computes in O(n) by storing previous two values." },
    { id: "dp-5", question: "Which classic DP problem asks: given n stairs, how many ways to reach top taking 1 or 2 steps?", options: ["Coin Change", "Climbing Stairs", "House Robber", "Longest Increasing Subsequence"], correct: 1, explanation: "Climbing Stairs is Fibonacci: ways[n] = ways[n-1] + ways[n-2]." },
    { id: "dp-6", question: "What is the 'state' in DP?", options: ["Random number", "Set of variables defining subproblem", "Final answer", "Recursion depth"], correct: 1, explanation: "DP state captures parameters that uniquely define a subproblem." },
    { id: "dp-7", question: "Which DP problem involves maximizing sum of non-adjacent houses?", options: ["Knapsack", "House Robber", "Longest Common Subsequence", "Edit Distance"], correct: 1, explanation: "House Robber: cannot rob adjacent houses." },
    { id: "dp-8", question: "What is the time complexity of the classic 0/1 Knapsack DP?", options: ["O(n)", "O(nW) where W=capacity", "O(2^n)", "O(n^2)"], correct: 1, explanation: "0/1 Knapsack DP uses a 2D table of size n x W." },
    { id: "dp-9", question: "Which DP technique finds the longest increasing subsequence in O(n log n)?", options: ["Memoization", "Patience sorting with binary search", "Tabulation", "Recursion"], correct: 1, explanation: "LIS can be optimized using patience sorting approach." },
    { id: "dp-10", question: "What is Edit Distance (Levenshtein distance) about?", options: ["Sorting strings", "Minimum operations to convert one string to another", "Longest common substring", "String compression"], correct: 1, explanation: "Edit distance computes minimum insertions, deletions, substitutions." },
  ],
};

// ============================================
// DATA OBJECTS
// ============================================
const dsaTopics = [
  { id: 1, name: "Arrays", icon: "📊", description: "Learn array operations, manipulations, and common interview problems", difficulty: "Easy-Medium", theory: `<h3 style="color:var(--accent); margin-bottom:1rem;">🗂️ Arrays — The Foundation of DSA</h3><p style="margin-bottom:1rem;">Arrays store elements in <strong>contiguous memory locations</strong>, giving lightning-fast index access.</p><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">⚡ Key Operations & Complexity</h4><table style="width:100%; border-collapse:collapse; margin-bottom:1rem; font-size:0.9rem;"><tr style="background:var(--dark-card);"><th style="padding:0.5rem 1rem; text-align:left; border:1px solid var(--glass-border);">Operation</th><th style="padding:0.5rem 1rem; text-align:left; border:1px solid var(--glass-border);">Time</th></tr><tr><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Access by index</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border); color:#22c55e;">O(1) ✅</td></tr><tr style="background:var(--dark-card);"><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Search (unsorted)</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">O(n)</td></tr><tr><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Search (sorted)</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border); color:#22c55e;">O(log n)</td></tr><tr style="background:var(--dark-card);"><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Insert at end</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border); color:#22c55e;">O(1) ✅</td></tr><tr><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Insert at middle</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">O(n)</td></tr><tr style="background:var(--dark-card);"><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Delete</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">O(n)</td></tr></table><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">🎯 Must-Know Interview Patterns</h4><ul style="list-style:none; padding:0; margin-bottom:1rem;"><li style="padding:0.3rem 0;">→ <strong>Two Pointers</strong> — pair sum, container with most water</li><li style="padding:0.3rem 0;">→ <strong>Sliding Window</strong> — max sum subarray of size k</li><li style="padding:0.3rem 0;">→ <strong>Prefix Sum</strong> — range sum queries</li><li style="padding:0.3rem 0;">→ <strong>Kadane's Algorithm</strong> — maximum subarray sum</li></ul><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">💡 Pro Tips</h4><ul style="list-style:none; padding:0; margin-bottom:1rem;"><li style="padding:0.3rem 0;">• Sorted array? Think Binary Search first!</li><li style="padding:0.3rem 0;">• Need pairs? Two pointers beats nested loops</li><li style="padding:0.3rem 0;">• Watch for index out of bounds errors</li><li style="padding:0.3rem 0;">• Always ask: can I solve this in-place?</li></ul><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">🏆 Real Interview Questions from FAANG</h4><p style="color:var(--text-secondary);">Two Sum (Google), Trapping Rain Water (Amazon), Maximum Subarray (Microsoft)</p>`, problems: ["Two Sum", "Maximum Subarray", "Merge Intervals", "Product Except Self", "Spiral Matrix", "Best Time to Buy and Sell Stock", "Move Zeroes", "Check If Array Is Sorted"] },
  { id: 2, name: "Strings", icon: "🔤", description: "Master string algorithms, pattern matching, and string manipulation", difficulty: "Easy-Medium", theory: `<h3 style="color:var(--accent); margin-bottom:1rem;">🔤 Strings — Text Processing Powerhouse</h3><p style="margin-bottom:1rem;">Strings are sequences of characters. <strong>Immutable in most languages</strong> — every modification creates a new string!</p><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">⚡ Key Operations & Complexity</h4><table style="width:100%; border-collapse:collapse; margin-bottom:1rem; font-size:0.9rem;"><tr style="background:var(--dark-card);"><th style="padding:0.5rem 1rem; text-align:left; border:1px solid var(--glass-border);">Operation</th><th style="padding:0.5rem 1rem; text-align:left; border:1px solid var(--glass-border);">Time</th></tr><tr><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Access by index</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border); color:#22c55e;">O(1) ✅</td></tr><tr style="background:var(--dark-card);"><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Concatenation</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">O(n)</td></tr><tr><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Substring search (naive)</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">O(n*m)</td></tr><tr style="background:var(--dark-card);"><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">KMP search</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border); color:#22c55e;">O(n+m) ✅</td></tr><tr><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Reverse</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">O(n)</td></tr></table><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">🎯 Must-Know Interview Patterns</h4><ul style="list-style:none; padding:0; margin-bottom:1rem;"><li style="padding:0.3rem 0;">→ <strong>Sliding Window</strong> — longest substring without repeating chars</li><li style="padding:0.3rem 0;">→ <strong>Two Pointers</strong> — palindrome check, reverse words</li><li style="padding:0.3rem 0;">→ <strong>Hash Map</strong> — anagram detection, character frequency</li><li style="padding:0.3rem 0;">→ <strong>Stack</strong> — valid parentheses, balanced brackets</li></ul><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">💡 Pro Tips</h4><ul style="list-style:none; padding:0; margin-bottom:1rem;"><li style="padding:0.3rem 0;">• Convert to char array when mutation needed</li><li style="padding:0.3rem 0;">• Use hash map for character frequency counting</li><li style="padding:0.3rem 0;">• Always clarify: case sensitive? spaces count?</li><li style="padding:0.3rem 0;">• ASCII trick: 'a'-'z' = 97-122, 'A'-'Z' = 65-90</li></ul><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">🏆 Real Interview Questions from FAANG</h4><p style="color:var(--text-secondary);">Longest Substring (Amazon), Group Anagrams (Google), Valid Parentheses (Microsoft)</p>`, problems: ["Longest Substring Without Repeating", "Valid Parentheses", "Palindrome Partitioning", "String to Integer", "Group Anagrams"] },
  { id: 3, name: "Linked List", icon: "🔗", description: "Singly, doubly, and circular linked lists with traversal techniques", difficulty: "Medium", theory: `<h3 style="color:var(--accent); margin-bottom:1rem;">🔗 Linked Lists — Dynamic Chain of Nodes</h3><p style="margin-bottom:1rem;">Each node holds <strong>data + pointer to next node</strong>. No random access but super fast insertions!</p><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">⚡ Key Operations & Complexity</h4><table style="width:100%; border-collapse:collapse; margin-bottom:1rem; font-size:0.9rem;"><tr style="background:var(--dark-card);"><th style="padding:0.5rem 1rem; text-align:left; border:1px solid var(--glass-border);">Operation</th><th style="padding:0.5rem 1rem; text-align:left; border:1px solid var(--glass-border);">Time</th></tr><tr><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Access by index</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">O(n)</td></tr><tr style="background:var(--dark-card);"><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Search</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">O(n)</td></tr><tr><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Insert at head</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border); color:#22c55e;">O(1) ✅</td></tr><tr style="background:var(--dark-card);"><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Insert at tail</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border); color:#22c55e;">O(1) ✅</td></tr><tr><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Insert at middle</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">O(n)</td></tr><tr style="background:var(--dark-card);"><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Delete</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">O(n)</td></tr></table><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">🔀 Types</h4><ul style="list-style:none; padding:0; margin-bottom:1rem;"><li style="padding:0.3rem 0;">→ <strong>Singly</strong> — each node points to next</li><li style="padding:0.3rem 0;">→ <strong>Doubly</strong> — each node points to next AND previous</li><li style="padding:0.3rem 0;">→ <strong>Circular</strong> — last node points back to first</li></ul><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">🎯 Must-Know Interview Patterns</h4><ul style="list-style:none; padding:0; margin-bottom:1rem;"><li style="padding:0.3rem 0;">→ <strong>Fast & Slow Pointers</strong> — cycle detection, find middle</li><li style="padding:0.3rem 0;">→ <strong>Dummy Node</strong> — simplifies edge cases</li><li style="padding:0.3rem 0;">→ <strong>Reverse in place</strong> — iterative and recursive</li><li style="padding:0.3rem 0;">→ <strong>Merge technique</strong> — merging two sorted lists</li></ul><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">💡 Pro Tips</h4><ul style="list-style:none; padding:0; margin-bottom:1rem;"><li style="padding:0.3rem 0;">• ALWAYS check for null pointers first!</li><li style="padding:0.3rem 0;">• Draw pointer manipulations before coding</li><li style="padding:0.3rem 0;">• Dummy node trick eliminates edge cases</li><li style="padding:0.3rem 0;">• Fast/slow pointer = most tested LL pattern</li></ul><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">🏆 Real Interview Questions from FAANG</h4><p style="color:var(--text-secondary);">Reverse Linked List (Amazon), Detect Cycle (Google), Remove Nth From End (Microsoft)</p>`, problems: ["Reverse Linked List", "Detect Cycle", "Merge Two Sorted Lists", "Remove Nth From End", "Intersection of Two Lists"] },
  { id: 4, name: "Trees", icon: "🌳", description: "Binary trees, BST, traversal algorithms, and tree-based problems", difficulty: "Medium-Hard", theory: `<h3 style="color:var(--accent); margin-bottom:1rem;">🌳 Trees — Hierarchical Data Mastery</h3><p style="margin-bottom:1rem;">Trees are <strong>non-linear hierarchical structures</strong>. Master recursion here and you master half of DSA!</p><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">⚡ Key Operations & Complexity (Balanced BST)</h4><table style="width:100%; border-collapse:collapse; margin-bottom:1rem; font-size:0.9rem;"><tr style="background:var(--dark-card);"><th style="padding:0.5rem 1rem; text-align:left; border:1px solid var(--glass-border);">Operation</th><th style="padding:0.5rem 1rem; text-align:left; border:1px solid var(--glass-border);">Time</th></tr><tr><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Search</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border); color:#22c55e;">O(log n) ✅</td></tr><tr style="background:var(--dark-card);"><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Insert</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border); color:#22c55e;">O(log n) ✅</td></tr><tr><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Delete</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border); color:#22c55e;">O(log n) ✅</td></tr><tr style="background:var(--dark-card);"><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Traversal</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">O(n)</td></tr></table><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">🔀 Traversal Types</h4><ul style="list-style:none; padding:0; margin-bottom:1rem;"><li style="padding:0.3rem 0;">→ <strong>Inorder (L→Root→R)</strong> — gives sorted output for BST ✅</li><li style="padding:0.3rem 0;">→ <strong>Preorder (Root→L→R)</strong> — used for tree copying</li><li style="padding:0.3rem 0;">→ <strong>Postorder (L→R→Root)</strong> — used for tree deletion</li><li style="padding:0.3rem 0;">→ <strong>Level Order (BFS)</strong> — processes level by level</li></ul><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">🎯 Must-Know Interview Patterns</h4><ul style="list-style:none; padding:0; margin-bottom:1rem;"><li style="padding:0.3rem 0;">→ <strong>Recursion</strong> — most tree problems have elegant solutions</li><li style="padding:0.3rem 0;">→ <strong>BFS</strong> — level order, shortest path</li><li style="padding:0.3rem 0;">→ <strong>DFS</strong> — path sum, diameter, LCA</li><li style="padding:0.3rem 0;">→ <strong>Morris Traversal</strong> — O(1) space traversal</li></ul><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">💡 Pro Tips</h4><ul style="list-style:none; padding:0; margin-bottom:1rem;"><li style="padding:0.3rem 0;">• Always handle null/empty tree first!</li><li style="padding:0.3rem 0;">• Think recursively — what does my function return?</li><li style="padding:0.3rem 0;">• Height = bottom-up, Depth = top-down</li><li style="padding:0.3rem 0;">• BST inorder traversal = sorted array</li></ul><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">🏆 Real Interview Questions from FAANG</h4><p style="color:var(--text-secondary);">Validate BST (Amazon), LCA (Google), Maximum Depth (Microsoft)</p>`, problems: ["Maximum Depth", "Validate BST", "Lowest Common Ancestor", "Invert Binary Tree", "Path Sum"] },
  { id: 5, name: "Graphs", icon: "🕸️", description: "Graph representations, traversal (BFS/DFS), shortest paths, and networks", difficulty: "Hard", theory: `<h3 style="color:var(--accent); margin-bottom:1rem;">🕸️ Graphs — Networks & Connections</h3><p style="margin-bottom:1rem;">Graphs model <strong>real-world networks</strong>: social media, maps, dependencies. Master this = ace system design too!</p><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">⚡ Key Algorithms & Complexity</h4><table style="width:100%; border-collapse:collapse; margin-bottom:1rem; font-size:0.9rem;"><tr style="background:var(--dark-card);"><th style="padding:0.5rem 1rem; text-align:left; border:1px solid var(--glass-border);">Algorithm</th><th style="padding:0.5rem 1rem; text-align:left; border:1px solid var(--glass-border);">Time</th></tr><tr><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">BFS</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border); color:#22c55e;">O(V+E) ✅</td></tr><tr style="background:var(--dark-card);"><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">DFS</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border); color:#22c55e;">O(V+E) ✅</td></tr><tr><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Dijkstra</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">O((V+E)logV)</td></tr><tr style="background:var(--dark-card);"><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Topological Sort</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">O(V+E)</td></tr><tr><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Union Find</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border); color:#22c55e;">O(α(n)) ✅</td></tr></table><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">🔀 Graph Types</h4><ul style="list-style:none; padding:0; margin-bottom:1rem;"><li style="padding:0.3rem 0;">→ <strong>Directed</strong> vs <strong>Undirected</strong></li><li style="padding:0.3rem 0;">→ <strong>Weighted</strong> vs <strong>Unweighted</strong></li><li style="padding:0.3rem 0;">→ <strong>Cyclic</strong> vs <strong>Acyclic (DAG)</strong></li><li style="padding:0.3rem 0;">→ <strong>Connected</strong> vs <strong>Disconnected</strong></li></ul><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">🎯 Must-Know Interview Patterns</h4><ul style="list-style:none; padding:0; margin-bottom:1rem;"><li style="padding:0.3rem 0;">→ <strong>BFS</strong> — shortest path, word ladder, level order</li><li style="padding:0.3rem 0;">→ <strong>DFS</strong> — islands, connected components, cycle detection</li><li style="padding:0.3rem 0;">→ <strong>Union Find</strong> — disjoint sets, connected components</li><li style="padding:0.3rem 0;">→ <strong>Topological Sort</strong> — course schedule, task ordering</li></ul><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">💡 Pro Tips</h4><ul style="list-style:none; padding:0; margin-bottom:1rem;"><li style="padding:0.3rem 0;">• ALWAYS track visited nodes to avoid infinite loops!</li><li style="padding:0.3rem 0;">• BFS = shortest path, DFS = exhaustive search</li><li style="padding:0.3rem 0;">• Draw the graph before you code</li><li style="padding:0.3rem 0;">• Adjacency list > matrix for sparse graphs</li></ul><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">🏆 Real Interview Questions from FAANG</h4><p style="color:var(--text-secondary);">Number of Islands (Google), Course Schedule (Amazon), Word Ladder (Facebook)</p>`, problems: ["Clone Graph", "Number of Islands", "Course Schedule", "Word Ladder", "Network Delay Time"] },
  { id: 6, name: "Dynamic Programming", icon: "🎯", description: "Recursion, memoization, tabulation, and optimization problems", difficulty: "Hard", theory: `<h3 style="color:var(--accent); margin-bottom:1rem;">🎯 Dynamic Programming — The Ultimate Problem Solver</h3><p style="margin-bottom:1rem;"><strong>DP = Recursion + Memoization</strong>. Master this and you can crack any FAANG interview!</p><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">⚡ Two Must-Have Conditions</h4><table style="width:100%; border-collapse:collapse; margin-bottom:1rem; font-size:0.9rem;"><tr style="background:var(--dark-card);"><th style="padding:0.5rem 1rem; text-align:left; border:1px solid var(--glass-border);">Condition</th><th style="padding:0.5rem 1rem; text-align:left; border:1px solid var(--glass-border);">Meaning</th></tr><tr><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Optimal Substructure</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Best solution uses best subsolutions</td></tr><tr style="background:var(--dark-card);"><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Overlapping Subproblems</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Same subproblems solved multiple times</td></tr></table><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">🔀 Two Approaches</h4><ul style="list-style:none; padding:0; margin-bottom:1rem;"><li style="padding:0.3rem 0;">→ <strong>Top-Down (Memoization)</strong> — recursive + cache = fast!</li><li style="padding:0.3rem 0;">→ <strong>Bottom-Up (Tabulation)</strong> — iterative, fill DP table</li></ul><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">🎯 Must-Know DP Patterns</h4><ul style="list-style:none; padding:0; margin-bottom:1rem;"><li style="padding:0.3rem 0;">→ <strong>1D DP</strong> — Fibonacci, Climbing Stairs, House Robber</li><li style="padding:0.3rem 0;">→ <strong>2D DP</strong> — Grid paths, Edit Distance, LCS</li><li style="padding:0.3rem 0;">→ <strong>Knapsack</strong> — 0/1 Knapsack, Coin Change, Subset Sum</li><li style="padding:0.3rem 0;">→ <strong>LIS Pattern</strong> — Longest Increasing Subsequence</li></ul><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">📝 5 Steps to Solve Any DP Problem</h4><ul style="list-style:none; padding:0; margin-bottom:1rem;"><li style="padding:0.3rem 0;">1️⃣ Define the state — what does dp[i] mean?</li><li style="padding:0.3rem 0;">2️⃣ Write the recurrence relation</li><li style="padding:0.3rem 0;">3️⃣ Identify base cases</li><li style="padding:0.3rem 0;">4️⃣ Determine computation order</li><li style="padding:0.3rem 0;">5️⃣ Optimize space if possible</li></ul><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">💡 Pro Tips</h4><ul style="list-style:none; padding:0; margin-bottom:1rem;"><li style="padding:0.3rem 0;">• Start with brute force → add memoization → optimize</li><li style="padding:0.3rem 0;">• Draw recursion tree to spot overlapping subproblems</li><li style="padding:0.3rem 0;">• Most 2D DP can reduce space from O(n²) to O(n)</li><li style="padding:0.3rem 0;">• If you see "minimum/maximum/count ways" → think DP!</li></ul><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">🏆 Real Interview Questions from FAANG</h4><p style="color:var(--text-secondary);">Coin Change (Amazon), Edit Distance (Google), LIS (Microsoft)</p>`, problems: ["Climbing Stairs", "Coin Change", "Longest Increasing Subsequence", "Edit Distance", "House Robber", "Fibonacci Number"] },
  { id: 7, name: "Matrix", icon: "🔢", description: "2D arrays, traversal techniques, rotations, and grid-based interview problems", difficulty: "Medium", theory: `<h3 style="color:var(--accent); margin-bottom:1rem;">🔢 Matrix — 2D Array Mastery</h3><p style="margin-bottom:1rem;">A matrix is a <strong>2D grid of elements</strong> accessed by row and column in O(1) time.</p><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">⚡ Key Operations & Complexity</h4><table style="width:100%; border-collapse:collapse; margin-bottom:1rem; font-size:0.9rem;"><tr style="background:var(--dark-card);"><th style="padding:0.5rem 1rem; text-align:left; border:1px solid var(--glass-border);">Operation</th><th style="padding:0.5rem 1rem; text-align:left; border:1px solid var(--glass-border);">Time</th></tr><tr><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Access element</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border); color:#22c55e;">O(1) ✅</td></tr><tr style="background:var(--dark-card);"><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Linear traversal</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">O(M×N)</td></tr><tr><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Transpose / Rotate</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">O(N²)</td></tr><tr style="background:var(--dark-card);"><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border);">Search (sorted matrix)</td><td style="padding:0.5rem 1rem; border:1px solid var(--glass-border); color:#22c55e;">O(M+N) ✅</td></tr></table><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">🎯 Must-Know Interview Patterns</h4><ul style="list-style:none; padding:0; margin-bottom:1rem;"><li style="padding:0.3rem 0;">→ <strong>Spiral Traversal</strong> — boundary pointer shrinking</li><li style="padding:0.3rem 0;">→ <strong>BFS/DFS on Grid</strong> — island counting, flood fill</li><li style="padding:0.3rem 0;">→ <strong>Transpose + Reverse</strong> — in-place 90° rotation</li><li style="padding:0.3rem 0;">→ <strong>Top-right corner search</strong> — O(M+N) sorted matrix search</li></ul><h4 style="color:var(--primary); margin:1rem 0 0.5rem;">🏆 Real Interview Questions from FAANG</h4><p style="color:var(--text-secondary);">Spiral Matrix (Amazon), Rotate Image (Google), Number of Islands (Microsoft), Search a 2D Matrix (Meta)</p>`, problems: ["Spiral Matrix", "Rotate Image", "Number of Islands", "Set Matrix Zeroes", "Search a 2D Matrix"] },
];

// ============================================
// PRACTICE PROBLEMS DATA
// ============================================
const practiceProblems = [
  { id: 1, title: "Two Sum", difficulty: "easy", tags: ["Arrays", "Hash Table"], acceptance: "48.2%", category: "arrays", description: "Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.", constraints: ["2 ≤ nums.length ≤ 10⁴", "-10⁹ ≤ nums[i] ≤ 10⁹", "Only one valid answer exists"], followUp: "Can you solve it in O(n) time complexity?", functionName: "twoSum", params: ["nums", "target"], testCases: [{ input: [[2,7,11,15], 9], expected: [0,1] }, { input: [[3,2,4], 6], expected: [1,2] }, { input: [[3,3], 6], expected: [0,1] }] },
  { id: 2, title: "Valid Parentheses", difficulty: "easy", tags: ["Strings", "Stack"], acceptance: "40.2%", category: "strings", description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.", constraints: ["1 ≤ s.length ≤ 10⁴", "s consists of parentheses only '()[]{}'"], followUp: "Can you solve it in O(n) time and O(n) space?", functionName: "isValid", params: ["brackets"], guide: "brackets: string of '()', '{}', '[]' characters\nreturns: true if every opening bracket has a matching closing bracket in the correct order, false otherwise", testCases: [{ input: ["()"], expected: true }, { input: ["()[]{}"], expected: true }, { input: ["(]"], expected: false }, { input: ["([)]"], expected: false }, { input: ["{[]}"], expected: true }] },
  { id: 3, title: "Merge Two Sorted Lists", difficulty: "easy", tags: ["Linked List", "Recursion"], acceptance: "58.5%", category: "linkedlist", description: "Given two sorted arrays list1 and list2, merge them into one sorted array.", constraints: ["0 ≤ list1.length, list2.length ≤ 50", "-100 ≤ list1[i], list2[i] ≤ 100"], followUp: "Can you solve it iteratively using O(1) extra space, and also recursively?", functionName: "mergeLists", params: ["list1", "list2"], guide: "list1: first sorted array of integers\nlist2: second sorted array of integers\nreturns: a new sorted array containing all elements from both lists in ascending order", testCases: [{ input: [[1,2,4], [1,3,4]], expected: [1,1,2,3,4,4] }, { input: [[], []], expected: [] }, { input: [[], [0]], expected: [0] }] },
  { id: 4, title: "Maximum Subarray", difficulty: "medium", tags: ["Arrays", "Divide & Conquer"], acceptance: "46.2%", category: "arrays", description: "Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum.", constraints: ["1 ≤ nums.length ≤ 10⁵", "-10⁴ ≤ nums[i] ≤ 10⁴"], followUp: "Can you solve it in O(n) time using Kadane's Algorithm?", functionName: "maxSubArray", params: ["nums"], testCases: [{ input: [[-2,1,-3,4,-1,2,1,-5,4]], expected: 6 }, { input: [[1]], expected: 1 }, { input: [[5,4,-1,7,8]], expected: 23 }, { input: [[-1]], expected: -1 }] },
  { id: 5, title: "LRU Cache", difficulty: "medium", tags: ["Design", "Hash Table"], acceptance: "37.5%", category: "arrays", description: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.", constraints: ["1 ≤ capacity ≤ 3000", "0 ≤ key, value ≤ 10⁴", "At most 2 × 10⁵ calls"], followUp: "Can you implement both get and put in O(1) time complexity?", functionName: "LRUCache", params: ["capacity"], testCases: [{ input: [2], methods: [["put", 1, 1], ["put", 2, 2], ["get", 1]], expected: 1 }, { input: [2], methods: [["put", 1, 1], ["put", 2, 2], ["get", 2]], expected: 2 }, { input: [2], methods: [["put", 1, 1], ["put", 2, 2], ["put", 3, 3], ["get", 1]], expected: -1 }, { input: [2], methods: [["put", 2, 1], ["put", 2, 2], ["get", 2]], expected: 2 }] },
  { id: 6, title: "Clone Graph", difficulty: "medium", tags: ["Graphs", "DFS", "BFS"], acceptance: "43.2%", category: "graphs", description: "Given an adjacency list representing a connected undirected graph, return a deep copy (clone) of the graph as an adjacency list.", constraints: ["0 ≤ adjList.length ≤ 100", "1 ≤ adjList[i][j] ≤ 100", "Each node's value is 1-indexed (node i+1 corresponds to adjList[i])"], followUp: "Can you solve it using both BFS and DFS approaches?", functionName: "cloneGraph", params: ["adjList"], guide: "adjList: 2D array where adjList[i] lists the neighbors of node i+1 (1-indexed)\nreturns: a deep copy of the adjacency list representing the cloned graph", testCases: [ { input: [[[2,4],[1,3],[2,4],[1,3]]], expected: [[2,4],[1,3],[2,4],[1,3]] }, { input: [[[]]], expected: [[]] }, { input: [[]], expected: [] } ] },
  { id: 7, title: "Longest Increasing Subsequence", difficulty: "hard", tags: ["DP", "Binary Search"], acceptance: "42.1%", category: "dp", description: "Given an integer array nums, return the length of the longest strictly increasing subsequence.", constraints: ["1 ≤ nums.length ≤ 2500", "-10⁴ ≤ nums[i] ≤ 10⁴"], followUp: "Can you improve from O(n²) DP to O(n log n) using binary search?", functionName: "lengthOfLIS", params: ["nums"], guide: "nums: array of integers\nreturns: length of the longest strictly increasing subsequence", testCases: [{ input: [[10,9,2,5,3,7,101,18]], expected: 4 }, { input: [[0,1,0,3,2,3]], expected: 4 }, { input: [[7,7,7,7,7,7,7]], expected: 1 }] },
  { id: 8, title: "Word Ladder", difficulty: "hard", tags: ["Graphs", "BFS"], acceptance: "31.4%", category: "graphs", description: "Given two words, beginWord and endWord, and a dictionary wordList, return the number of words in the shortest transformation sequence.", constraints: ["1 ≤ beginWord.length ≤ 10", "endWord.length == beginWord.length", "1 ≤ wordList.length ≤ 5000"], followUp: "Can you find ALL shortest transformation sequences?", functionName: "ladderLength", params: ["beginWord", "endWord", "wordList"], testCases: [{ input: ["hit", "cog", ["hot","dot","dog","lot","log","cog"]], expected: 5 }, { input: ["hit", "cog", ["hot","dot","dog","lot","log"]], expected: 0 }] },
  { id: 9, title: "Trapping Rain Water", difficulty: "hard", tags: ["Arrays", "Two Pointers"], acceptance: "48.7%", category: "arrays", description: "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.", constraints: ["1 ≤ height.length ≤ 2 × 10⁴", "0 ≤ height[i] ≤ 10⁵"], followUp: "Can you solve it in O(n) time and O(1) space using the two-pointer technique?", functionName: "trap", params: ["height"], guide: "height: array of non-negative integers representing bar heights in the elevation map\nreturns: total units of rainwater that can be trapped between the bars\n\nHint: Use two pointers (left at 0, right at end). Track maxLeft and maxRight. At each step, process the shorter side: if height[left] < height[right], water += max(0, maxLeft - height[left]), else water += max(0, maxRight - height[right]).", testCases: [{ input: [[0,1,0,2,1,0,1,3,2,1,2,1]], expected: 6 }, { input: [[4,2,0,3,2,5]], expected: 9 }] },
  { id: 10, title: "Reverse Linked List", difficulty: "easy", tags: ["Linked List"], acceptance: "72.1%", category: "linkedlist", description: "Given an array representing a linked list, reverse it and return the reversed array.", constraints: ["0 ≤ arr.length ≤ 5000", "-5000 ≤ arr[i] ≤ 5000"], followUp: "Can you solve it both iteratively and recursively?", functionName: "reverseList", params: ["head"], guide: "head: array of integers representing the linked list values\nreturns: reversed array with elements in opposite order\n\nHint: Use two pointers (prev starts empty, curr starts at head). Iterate through, reversing each element's position.", testCases: [{ input: [[1,2,3,4,5]], expected: [5,4,3,2,1] }, { input: [[1,2]], expected: [2,1] }, { input: [[]], expected: [] }] },
  { id: 11, title: "Invert Binary Tree", difficulty: "easy", tags: ["Trees", "DFS"], acceptance: "68.5%", category: "trees", description: "Given a binary tree represented as a level-order array, invert it and return the inverted level-order array.", constraints: ["0 ≤ arr.length ≤ 100", "-100 ≤ arr[i] ≤ 100"], followUp: "Can you solve it both recursively and iteratively using a queue or stack?", functionName: "invertTree", params: ["root"], guide: "root: level-order array of integers representing the binary tree (null for missing nodes)\nreturns: level-order array of the inverted binary tree (swapped left/right children)\n\nHint: Recursively swap left and right children at each node. Base case: when root is null or empty.", testCases: [{ input: [[4,2,7,1,3,6,9]], expected: [4,7,2,9,6,3,1] }, { input: [[2,1,3]], expected: [2,3,1] }, { input: [[]], expected: [] }] },
  { id: 12, title: "Validate BST", difficulty: "medium", tags: ["Trees", "Recursion"], acceptance: "28.4%", category: "trees", description: "Given a binary tree represented as a level-order array (null for missing children), determine if it is a valid BST.", constraints: ["1 ≤ arr.length ≤ 10⁴", "-2³¹ ≤ arr[i] ≤ 2³¹ - 1"], followUp: "Can you solve it without recursion?", functionName: "isValidBST", params: ["root"], testCases: [{ input: [[2,1,3]], expected: true }, { input: [[5,1,4,null,null,3,6]], expected: false }] },
  { id: 13, title: "Number of Islands", difficulty: "medium", tags: ["Graphs", "DFS"], acceptance: "54.8%", category: "graphs", description: "Given an m x n 2D binary grid which represents a map of '1's (land) and '0's (water), return the number of islands.", constraints: ["1 ≤ m, n ≤ 300", "grid[i][j] is '0' or '1'"], followUp: "Can you solve it using both DFS and Union-Find?", functionName: "numIslands", params: ["grid"], testCases: [{ input: [[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]], expected: 1 }, { input: [[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]], expected: 3 }, { input: [[["0"]]], expected: 0 }] },
  { id: 14, title: "House Robber", difficulty: "medium", tags: ["DP", "Arrays"], acceptance: "42.3%", category: "dp", description: "You are a professional robber planning to rob houses along a street. Return the maximum amount of money you can rob without robbing two adjacent houses.", constraints: ["1 ≤ nums.length ≤ 100", "0 ≤ nums[i] ≤ 400"], followUp: "What if the houses are arranged in a circle?", functionName: "rob", params: ["nums"], guide: "nums: array of non-negative integers representing money in each house\nreturns: maximum amount that can be robbed tonight without alerting the police\n\nHint: Use dynamic programming. At each house i, decide to rob it (add nums[i] to dp[i-2]) or skip it (keep dp[i-1]). The optimal is max(rob, skip).", testCases: [{ input: [[1,2,3,1]], expected: 4 }, { input: [[2,7,9,3,1]], expected: 12 }, { input: [[2,1,1,2]], expected: 4 }] },
  { id: 15, title: "Course Schedule", difficulty: "medium", tags: ["Graphs", "Topological Sort"], acceptance: "44.7%", category: "graphs", description: "There are numCourses courses. Given prerequisites, return true if you can finish all courses.", constraints: ["1 ≤ numCourses ≤ 2000", "0 ≤ prerequisites.length ≤ 5000", "prerequisites[i].length == 2"], followUp: "Can you return the actual valid course order?", functionName: "canFinish", params: ["numCourses", "prerequisites"], testCases: [{ input: [2, [[1,0]]], expected: true }, { input: [2, [[1,0],[0,1]]], expected: false }] },
  { id: 16, title: "Best Time to Buy and Sell Stock", difficulty: "easy", tags: ["Arrays", "Greedy"], acceptance: "54.3%", category: "arrays", description: "Given an array prices where prices[i] is the price of a given stock on the iᵗʰ day, return the maximum profit.", constraints: ["1 ≤ prices.length ≤ 10⁵", "0 ≤ prices[i] ≤ 10⁴"], followUp: "Can you solve it in O(n) time and O(1) space?", functionName: "maxProfit", params: ["prices"], testCases: [{ input: [[7,1,5,3,6,4]], expected: 5 }, { input: [[7,6,4,3,1]], expected: 0 }, { input: [[2,4,1]], expected: 2 }] },
  { id: 17, title: "Move Zeroes", difficulty: "easy", tags: ["Arrays", "Two Pointers"], acceptance: "60.1%", category: "arrays", description: "Given an integer array nums, move all 0s to the end of it while maintaining the relative order of the non-zero elements.", constraints: ["1 ≤ nums.length ≤ 10⁴", "−2³¹ ≤ nums[i] ≤ 2³¹ − 1"], followUp: "Can you minimize the total number of operations?", functionName: "moveZeroes", params: ["nums"], guide: "nums: integer array to move zeroes in-place\nreturns: array with all zeroes moved to the end while preserving relative order of non-zero elements\n\nHint: Use two-pointer technique. One pointer (nonZeroIndex) tracks where the next non-zero should go. Iterate through the array, moving non-zero elements forward, then fill remaining positions with zero.", testCases: [{ input: [[0,1,0,3,12]], expected: [1,3,12,0,0] }, { input: [[0]], expected: [0] }, { input: [[1,0]], expected: [1,0] }] },
  { id: 18, title: "Valid Anagram", difficulty: "easy", tags: ["Strings", "Hash Table"], acceptance: "63.4%", category: "strings", description: "Given two strings s and t, return true if t is an anagram of s.", constraints: ["1 ≤ s.length, t.length ≤ 5 × 10⁴", "s and t consist of lowercase English letters only"], followUp: "What if the inputs contain Unicode characters?", functionName: "isAnagram", params: ["string1", "string2"], guide: "string1: first input string\nstring2: second input string\nreturns: true if string2 is an anagram of string1 (same characters, different order), false otherwise\n\nHint: Use a frequency counter array of size 26 for lowercase English letters. Count occurrences of each character in s (+1) and t (-1). If all counts are zero at the end, it is a valid anagram.", testCases: [{ input: ["anagram", "nagaram"], expected: true }, { input: ["rat", "car"], expected: false }, { input: ["a", "a"], expected: true }] },
  { id: 19, title: "Single Number", difficulty: "easy", tags: ["Arrays", "Bit Manipulation"], acceptance: "70.2%", category: "arrays", description: "Given a non-empty array of integers nums, every element appears twice except for one. Find that single one.", constraints: ["1 ≤ nums.length ≤ 3 × 10⁴", "-3 × 10⁴ ≤ nums[i] ≤ 3 × 10⁴"], followUp: "Can you solve it using XOR bit manipulation?", functionName: "singleNumber", params: ["nums"], testCases: [{ input: [[2,2,1]], expected: 1 }, { input: [[4,1,2,1,2]], expected: 4 }, { input: [[1]], expected: 1 }] },
  { id: 20, title: "Intersection of Two Arrays", difficulty: "easy", tags: ["Arrays", "Hash Set"], acceptance: "72.8%", category: "arrays", description: "Given two integer arrays nums1 and nums2, return an array of their intersection (sorted, unique).", constraints: ["1 ≤ nums1.length, nums2.length ≤ 1000", "0 ≤ nums1[i], nums2[i] ≤ 1000"], followUp: "What if the arrays are already sorted?", functionName: "intersection", params: ["nums1", "nums2"], testCases: [{ input: [[1,2,2,1], [2,2]], expected: [2] }, { input: [[4,9,5], [9,4,9,8,4]], expected: [4,9] }] },
  { id: 21, title: "Check If Array Is Sorted", difficulty: "easy", tags: ["Arrays"], acceptance: "78.5%", category: "arrays", description: "Given an array of integers nums, return true if it is sorted in non-decreasing order.", constraints: ["1 ≤ nums.length ≤ 10⁴", "−10⁹ ≤ nums[i] ≤ 10⁹"], followUp: "Can you solve it in O(n) time complexity and O(1) space?", functionName: "isSorted", params: ["nums"], testCases: [{ input: [[1,2,3,4]], expected: true }, { input: [[5,4,3,2,1]], expected: false }, { input: [[1,1,2,2,3]], expected: true }] },
  { id: 22, title: "Fibonacci Number", difficulty: "easy", tags: ["Recursion", "Dynamic Programming"], acceptance: "85.2%", category: "dp", description: "Given n, return the nth Fibonacci number (F(0)=0, F(1)=1).", constraints: ["0 ≤ n ≤ 30"], followUp: "Can you solve it using recursion, memoization, and bottom-up tabulation?", functionName: "fib", params: ["n"], testCases: [{ input: [2], expected: 1 }, { input: [3], expected: 2 }, { input: [5], expected: 5 }, { input: [0], expected: 0 }] },
  { id: 23, title: "Merge Intervals", difficulty: "medium", tags: ["Arrays", "Sorting"], acceptance: "46.4%", category: "arrays", description: "Given an array of intervals, merge all overlapping intervals.", constraints: ["1 ≤ intervals.length ≤ 10⁴", "intervals[i].length == 2", "0 ≤ starti ≤ endi ≤ 10⁴"], followUp: "Can you solve it in O(n log n) time?", functionName: "merge", params: ["intervals"], testCases: [{ input: [[[1,3],[2,6],[8,10],[15,18]]], expected: [[1,6],[8,10],[15,18]] }, { input: [[[1,4],[4,5]]], expected: [[1,5]] }] },
  { id: 24, title: "Product Except Self", difficulty: "medium", tags: ["Arrays", "Prefix Sum"], acceptance: "65.2%", category: "arrays", description: "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all elements except nums[i].", constraints: ["2 ≤ nums.length ≤ 10⁵", "-30 ≤ nums[i] ≤ 30"], followUp: "Can you solve it in O(1) extra space?", functionName: "productExceptSelf", params: ["nums"], testCases: [{ input: [[1,2,3,4]], expected: [24,12,8,6] }, { input: [[-1,1,0,-3,3]], expected: [0,0,9,0,0] }] },
  { id: 25, title: "Spiral Matrix", difficulty: "medium", tags: ["Arrays", "Matrix"], acceptance: "44.8%", category: "arrays", description: "Given an m x n matrix, return all elements of the matrix in spiral order.", constraints: ["m == matrix.length", "n == matrix[0].length", "1 ≤ m, n ≤ 10", "-100 ≤ matrix[i][j] ≤ 100"], followUp: "Can you solve it without using extra space?", functionName: "spiralOrder", params: ["matrix"], testCases: [{ input: [[[1,2,3],[4,5,6],[7,8,9]]], expected: [1,2,3,6,9,8,7,4,5] }, { input: [[[1,2,3,4],[5,6,7,8],[9,10,11,12]]], expected: [1,2,3,4,8,12,11,10,9,5,6,7] }] },
  { id: 26, title: "Longest Substring Without Repeating", difficulty: "medium", tags: ["Strings", "Sliding Window", "Hash Map"], acceptance: "33.8%", category: "strings", description: "Given a string s, find the length of the longest substring without repeating characters.", constraints: ["0 ≤ s.length ≤ 5 × 10⁴"], followUp: "Can you solve it in O(n) using sliding window?", functionName: "lengthOfLongestSubstring", params: ["s"], testCases: [{ input: ["abcabcbb"], expected: 3 }, { input: ["bbbbb"], expected: 1 }, { input: ["pwwkew"], expected: 3 }, { input: [""], expected: 0 }] },
  { id: 27, title: "Group Anagrams", difficulty: "medium", tags: ["Strings", "Hash Map", "Sorting"], acceptance: "67.3%", category: "strings", description: "Given an array of strings strs, group the anagrams together (return sorted groups, sorted internally).", constraints: ["1 ≤ strs.length ≤ 10⁴", "0 ≤ strs[i].length ≤ 100"], followUp: "Can you solve it without sorting each string?", functionName: "groupAnagrams", params: ["strs"], testCases: [{ input: [["eat","tea","tan","ate","nat","bat"]], expected: [["ate","eat","tea"],["bat"],["nat","tan"]] }, { input: [[""]], expected: [[""]] }, { input: [["a"]], expected: [["a"]] }] },
  { id: 28, title: "Detect Cycle", difficulty: "easy", tags: ["Linked List", "Two Pointers"], acceptance: "49.2%", category: "linkedlist", description: "Given an array and a cycle position, detect if there is a cycle (use Floyd's algorithm). Represent as an array with the last element linking back to the index at cyclePos, or -1 for no cycle.", constraints: ["arr.length in range [0, 10⁴]", "-10⁵ ≤ arr[i] ≤ 10⁵"], followUp: "Can you solve it using Floyd's cycle detection algorithm?", functionName: "hasCycle", params: ["head", "cyclePos"], testCases: [{ input: [[3,2,0,-4], 1], expected: true }, { input: [[1,2], 0], expected: true }, { input: [[1], -1], expected: false }] },
  { id: 29, title: "Remove Nth From End", difficulty: "medium", tags: ["Linked List", "Two Pointers"], acceptance: "42.5%", category: "linkedlist", description: "Given an array and n, remove the nth element from the end and return the new array.", constraints: ["1 ≤ arr.length ≤ 30", "0 ≤ arr[i] ≤ 100", "1 ≤ n ≤ arr.length"], followUp: "Can you solve it in one pass using two pointers?", functionName: "removeNthFromEnd", params: ["head", "n"], testCases: [{ input: [[1,2,3,4,5], 2], expected: [1,2,3,5] }, { input: [[1], 1], expected: [] }, { input: [[1,2], 1], expected: [1] }] },
  { id: 30, title: "Intersection of Two Lists", difficulty: "easy", tags: ["Linked List", "Two Pointers"], acceptance: "57.8%", category: "linkedlist", description: "Given two arrays that intersect at a given index, find the intersection value. Passed as (listA, listB, intersectVal). Returns the intersecting value or null.", constraints: ["1 ≤ m, n ≤ 3 × 10⁴"], followUp: "Can you solve it in O(m+n) time and O(1) space?", functionName: "getIntersection", params: ["listA", "listB", "intersectVal"], testCases: [{ input: [[4,1,8,4,5], [5,6,1,8,4,5], 8], expected: 8 }, { input: [[1,9,1,2,4], [3,2,4], 2], expected: 2 }] },
  { id: 31, title: "Maximum Depth", difficulty: "easy", tags: ["Trees", "DFS", "BFS"], acceptance: "73.8%", category: "trees", description: "Given a binary tree represented as a level-order array (null for missing children), return its maximum depth.", constraints: ["0 ≤ arr.length ≤ 10⁴", "-100 ≤ arr[i] ≤ 100"], followUp: "Can you solve it both recursively and iteratively?", functionName: "maxDepth", params: ["root"], testCases: [{ input: [[3,9,20,null,null,15,7]], expected: 3 }, { input: [[1,null,2]], expected: 2 }, { input: [[]], expected: 0 }] },
  { id: 32, title: "Lowest Common Ancestor", difficulty: "medium", tags: ["Trees", "DFS"], acceptance: "61.4%", category: "trees", description: "Given a BST as a level-order array and two values p and q, find the LCA value. Returns the LCA node value.", constraints: ["2 ≤ arr.length ≤ 10⁵"], followUp: "Can you solve it for a general binary tree?", functionName: "lowestCommonAncestor", params: ["root", "p", "q"], testCases: [{ input: [[6,2,8,0,4,7,9,null,null,3,5], 2, 8], expected: 6 }, { input: [[6,2,8,0,4,7,9,null,null,3,5], 2, 4], expected: 2 }] },
  { id: 33, title: "Path Sum", difficulty: "easy", tags: ["Trees", "DFS"], acceptance: "49.3%", category: "trees", description: "Given a binary tree represented as a level-order array and a target sum, return true if there is a root-to-leaf path with the given sum.", constraints: ["0 ≤ arr.length ≤ 5000", "-1000 ≤ arr[i] ≤ 1000", "-1000 ≤ targetSum ≤ 1000"], followUp: "Can you find all paths that sum to target?", functionName: "hasPathSum", params: ["root", "targetSum"], testCases: [{ input: [[5,4,8,11,null,13,4,7,2,null,null,null,1], 22], expected: true }, { input: [[1,2,3], 5], expected: false }, { input: [[], 0], expected: false }] },
  { id: 34, title: "Network Delay Time", difficulty: "medium", tags: ["Graphs", "Dijkstra"], acceptance: "52.3%", category: "graphs", description: "Given n nodes, a times array of [u, v, w] edges, and source k, return the minimum time for all nodes to receive the signal, or -1 if impossible.", constraints: ["1 ≤ k ≤ n ≤ 100", "1 ≤ times.length ≤ 6000"], followUp: "Can you solve it using Dijkstra's algorithm?", functionName: "networkDelayTime", params: ["times", "n", "k"], testCases: [{ input: [[[2,1,1],[3,2,1],[3,4,2]], 4, 3], expected: 2 }, { input: [[[1,2,1]], 2, 1], expected: 1 }] },
  { id: 35, title: "Climbing Stairs", difficulty: "easy", tags: ["DP", "Recursion"], acceptance: "51.9%", category: "dp", description: "You are climbing a staircase. It takes n steps to reach the top. In how many distinct ways can you climb to the top?", constraints: ["1 ≤ n ≤ 45"], followUp: "Can you generalize to k steps at a time?", functionName: "climbStairs", params: ["n"], testCases: [{ input: [2], expected: 2 }, { input: [3], expected: 3 }, { input: [5], expected: 8 }] },
  { id: 36, title: "Coin Change", difficulty: "medium", tags: ["DP", "BFS"], acceptance: "42.6%", category: "dp", description: "You are given coins of different denominations and an amount. Return the fewest number of coins to make that amount.", constraints: ["1 ≤ coins.length ≤ 12", "1 ≤ coins[i] ≤ 2³¹ - 1", "0 ≤ amount ≤ 10⁴"], followUp: "Can you solve it using both top-down and bottom-up DP?", functionName: "coinChange", params: ["coins", "amount"], testCases: [{ input: [[1,2,5], 11], expected: 3 }, { input: [[2], 3], expected: -1 }, { input: [[1], 0], expected: 0 }] },
  { id: 37, title: "Edit Distance", difficulty: "hard", tags: ["DP", "Strings"], acceptance: "56.4%", category: "dp", description: "Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2.", constraints: ["0 ≤ word1.length, word2.length ≤ 500", "word1 and word2 consist of lowercase English letters"], followUp: "Can you optimize space from O(m*n) to O(min(m,n))?", functionName: "minDistance", params: ["word1", "word2"], testCases: [{ input: ["horse", "ros"], expected: 3 }, { input: ["intention", "execution"], expected: 5 }, { input: ["", "a"], expected: 1 }] },
];

// ============================================
// DAILY CHALLENGES
// ============================================
const dailyChallenges = [
  { id: "daily-1", title: "Two Sum Warmup", description: "Solve Two Sum using a hash map for O(n) time complexity.", problemId: 1, xpReward: 50 },
  { id: "daily-2", title: "Valid Parentheses Challenge", description: "Check if all brackets are correctly matched and nested.", problemId: 2, xpReward: 50 },
  { id: "daily-3", title: "Reverse a Linked List", description: "Iteratively reverse a singly linked list.", problemId: 10, xpReward: 75 },
  { id: "daily-4", title: "Maximum Subarray Sprint", description: "Find the contiguous subarray with the largest sum.", problemId: 4, xpReward: 75 },
  { id: "daily-5", title: "Invert Binary Tree", description: "Flip every node's left and right children.", problemId: 11, xpReward: 75 },
  { id: "daily-6", title: "Clone a Graph", description: "Return a deep copy of an undirected connected graph.", problemId: 6, xpReward: 100 },
  { id: "daily-7", title: "Climbing Stairs Combo", description: "Use Fibonacci-style DP to count ways to reach the top.", problemId: null, xpReward: 100 },
];

// ============================================
// CHATBOT RESPONSES
// ============================================
const chatbotResponses = {
  "time complexity": "Time complexity measures how an algorithm's runtime grows with input size. Common complexities: O(1) constant, O(log n) logarithmic, O(n) linear, O(n log n) linearithmic, O(n²) quadratic, O(2^n) exponential.",
  "space complexity": "Space complexity measures memory usage relative to input size. Aim for O(1) or O(n) space. In-place algorithms modify input directly.",
  arrays: "Arrays provide O(1) random access but fixed size. Use when you need fast lookups and index-based access. Key operations: insert O(n), delete O(n), search O(n) unsorted / O(log n) binary search on sorted arrays.",
  "linked list": "Linked lists offer O(1) insertion/deletion at any position but O(n) access time. Use when frequent insertions/deletions needed. Types: singly (one pointer), doubly (two pointers), circular (last points to first).",
  tree: "Trees are hierarchical. Binary trees: each node has ≤2 children. BST: left < root < right. Balanced (AVL, Red-Black) ensure O(log n) operations. Traversals: inorder (left-root-right), preorder (root-left-right), postorder (left-right-root).",
  graph: "Graphs represent networks. Directed vs undirected, weighted vs unweighted, cyclic vs acyclic. Representations: adjacency list (space-efficient) vs adjacency matrix (O(1) edge lookup). Traversals: BFS (shortest path on unweighted graphs), DFS (cycle detection, topological sort).",
  "dynamic programming": "DP solves problems with optimal substructure & overlapping subproblems. Memoization (top-down) caches recursive calls. Tabulation (bottom-up) fills DP table iteratively. Steps: identify state, recurrence, base cases. Classic problems: Fibonacci, Knapsack, LCS, LIS, Coin Change.",
  greedy: "Greedy algorithms make locally optimal choices hoping for global optimum. Works when greedy choice property holds. Examples: Dijkstra's shortest path, Huffman coding, activity selection.",
  sorting: "Common sorting algorithms: Bubble O(n²), Selection O(n²), Insertion O(n²), Merge O(n log n), Quick O(n log n) average, Heap O(n log n), Counting O(n+k), Radix O(d(n+b)).",
  "binary search": "Binary search on sorted arrays: repeatedly divide search interval in half. Time O(log n).",
  recursion: "Recursion solves problems by breaking into smaller subproblems. Base case stops recursion. Recursive case calls function with smaller input. Use for tree traversals, backtracking, divide & conquer.",
  "big o": "Big O describes upper bound of growth rate. Common: O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2^n) < O(n!).",
  bfs: "Breadth-First Search explores all neighbors before moving deeper. Use queue. Applications: shortest path (unweighted), level-order traversal.",
  dfs: "Depth-First Search goes deep before backtracking. Use stack (explicit or recursion). Applications: cycle detection, topological sort, connected components.",
  default: "I can help with DSA topics, coding problems, system design, interview tips, and career advice. Try asking about specific algorithms, data structures, time complexity, or problem-solving strategies!",
};

// ============================================
// USER PROGRESS STATE
// ============================================
let userProgress = {
  name: "Learner",
  avatar: "🚀",
  completedProblems: [],
  completedDailyChallenges: [],
  codingPersonality: { type: "brute-force first", bruteForceCount: 1, slowAccurateCount: 0, greedyCount: 0, overOptimizerCount: 0 },
  favoriteProblems: [],
  recentProblems: [],
  problemNotes: {},
  spacedRepetition: {},
  reviewStreak: 0,
  xp: 0,
  level: 1,
  streak: 0,
  freezes: 0,
  freezeHistory: [],
  badges: [],
  completedRoadmapSteps: [],
  lastActive: null,
  quizScores: {},
  dailyGoals: {},

  bestQuizTimes: {},
  activityData: {},
  xpHistory: [],
  quizAttempts: [],
  practiceEvents: [],
  mistakeDna: { offByOneCount: 0, recursionBaseCaseCount: 0, wrongLogicCount: 0, recentLogs: [] },
  revisionSchedule: { arrays: { currentStage: 0, nextReviewDate: null, history: [] }, strings: { currentStage: 0, nextReviewDate: null, history: [] }, linkedlist: { currentStage: 0, nextReviewDate: null, history: [] }, trees: { currentStage: 0, nextReviewDate: null, history: [] }, graphs: { currentStage: 0, nextReviewDate: null, history: [] }, dp: { currentStage: 0, nextReviewDate: null, history: [] } }
};

// Load saved data
if (localStorage.getItem("algoInfinityVerse")) {
  try {
    const loaded = JSON.parse(localStorage.getItem("algoInfinityVerse"));
  if (loaded && typeof loaded === "object") {
    Object.assign(userProgress, loaded);
    if (!userProgress.dailyGoals) userProgress.dailyGoals = {};
    if (!userProgress.spacedRepetition) userProgress.spacedRepetition = {};
    if (userProgress.reviewStreak === undefined) userProgress.reviewStreak = 0;

      if (loaded.quizScores) userProgress.quizScores = { ...(userProgress.quizScores || {}), ...loaded.quizScores };
      if (!userProgress.revisionSchedule) userProgress.revisionSchedule = {};
      ["arrays", "strings", "linkedlist", "trees", "graphs", "dp"].forEach(topic => {
        if (!userProgress.revisionSchedule[topic]) {
          userProgress.revisionSchedule[topic] = { currentStage: 0, nextReviewDate: null, history: [] };
        }
      });
    }
  } catch (e) { console.error("Error loading progress:", e); }
}

// ============================================
// SPACED REPETITION
// ============================================
const REVISION_INTERVALS = [1, 3, 7, 14];

function scheduleNextRevision(topicId) {
  if (!userProgress.revisionSchedule || !userProgress.revisionSchedule[topicId]) {
    console.error(`Topic "${topicId}" not found.`);
    return;
  }
  const now = new Date();
  const schedule = userProgress.revisionSchedule[topicId];
  const maxIdx = REVISION_INTERVALS.length - 1;
  const safeStage = Math.min(Math.max(0, schedule.currentStage), maxIdx);
  const daysToAdd = REVISION_INTERVALS[safeStage] || 1;
  const nextDate = new Date();
  nextDate.setDate(now.getDate() + daysToAdd);
  schedule.nextReviewDate = nextDate.toISOString();
  schedule.history.push({ reviewedAt: now.toISOString(), stageCompleted: schedule.currentStage, daysCalculated: daysToAdd, nextReviewDueDate: nextDate.toISOString() });
  if (schedule.currentStage < REVISION_INTERVALS.length - 1) schedule.currentStage++;
  if (typeof saveUserData === "function") saveUserData();
  else localStorage.setItem("algoInfinityVerse", JSON.stringify(userProgress));
  console.log(`[Scheduler] ${topicId}: Next review in ${daysToAdd} days.`);
}

function handleQuizCompletionForRevision(topicId, scorePercentage) {
  if (scorePercentage >= 70) {
    scheduleNextRevision(topicId);
    injectRevisionSchedulerUI(topicId);
  }
}

function injectRevisionSchedulerUI(topicId) {
  if (!userProgress.revisionSchedule?.[topicId]) return;

  const targetHeader = document.querySelector(".arr-lesson-header") || document.querySelector("h3") || document.querySelector("h2");
  if (!targetHeader) { console.warn("[Scheduler] No target header found."); return; }
  const existing = document.getElementById("revision-scheduler-badge");
  if (existing) existing.remove();
  const schedule = userProgress.revisionSchedule[topicId];
  const now = new Date();
  let statusHTML = "";
  if (!schedule.nextReviewDate) {
    statusHTML = `<span class="rev-badge rev-new">🆕 Not Scheduled Yet</span>`;
  } else {
    const nextDate = new Date(schedule.nextReviewDate);
    if (now >= nextDate) statusHTML = `<span class="rev-badge rev-due">⚡ Review Due Now!</span>`;
    else statusHTML = `<span class="rev-badge rev-waiting">📅 Next Review: ${nextDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>`;
  }
  const container = document.createElement("div");
  container.id = "revision-scheduler-badge";
  container.className = "revision-scheduler-card";
  container.style.maxWidth = "600px";
  container.style.marginTop = "1rem";
  container.innerHTML = `<div class="rev-card-content"><div class="rev-info"><span class="rev-title">🔄 Spaced Repetition Scheduler</span><span class="rev-stage">Stage ${schedule.currentStage}/4</span></div>${statusHTML}</div><div class="rev-history-text">History Track: ${schedule.history.length} checkpoints</div>`;
  targetHeader.parentNode.insertBefore(container, targetHeader.nextSibling);
}

// ============================================
// QUIZ EDITOR STATE
// ============================================
let currentProblem = null;

// ==========================================
// 1. SINGLE CENTRALIZED INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded fired, initializing app...');
  loadUserData();
  //initFlashcardsRevision();

  initLoadingScreen();
  initNavbar();
  initHeroSection();
  initTopicsSection();
  initQuizSection();
  initPracticeSection();
  initRoadmap();
  initDashboard();
  initGamification();
  initChatbot();
  initProfile();
  initScrollEffects();
  console.log('App initialization complete');
});

document.addEventListener("DOMContentLoaded", () => {
  loadUserData();
  initLoadingScreen();
  initNavbar();
  initHeroSection();
  initTopicOfTheDay();
  initTopicsSection();
  initQuizSection();
  initPracticeSection();
  initRoadmap();
  initDashboard();
  initGamification();
  initDailyChallenge();
  initChatbot();
  initProfile();
  initAiInterviewer();
  initNewsletterValidation();
  initScrollEffects();
  initFooterCurrentDate();
  updateProfile();
});

// ============================================
// AGENTIC AI INTERVIEW COMPANION (ISSUE #578)
// ============================================
let isAiInterviewerActive = false;
let workspaceSocket = null;

// 1. Claude's Floating UI Styles
(function injectAiHintStyles() {
  if (document.getElementById('ai-hint-styles')) return;
  const style = document.createElement('style');
  style.id = 'ai-hint-styles';
 style.textContent = `
    #ai-hint-bubble { position: absolute; bottom: 70px; right: 16px; width: 300px; max-width: calc(100% - 32px); background: #0f1f1a; border: 1px solid #10b981; border-left: 4px solid #10b981; border-radius: 12px; padding: 14px 16px; z-index: 99999; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6); font-family: 'Poppins', sans-serif; animation: ai-hint-slide-in 0.28s cubic-bezier(0.34, 1.56, 0.64, 1); pointer-events: all; }
    #ai-hint-bubble.ai-hint-dismissing { animation: ai-hint-slide-out 0.2s ease-in forwards; }
    @keyframes ai-hint-slide-in { from { opacity: 0; transform: translateY(16px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes ai-hint-slide-out { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(12px); } }
    #ai-hint-bubble .ai-hint-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    #ai-hint-bubble .ai-hint-title { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600; color: #10b981; letter-spacing: 0.3px; font-family: 'Orbitron', sans-serif; }
    #ai-hint-bubble .ai-hint-close { background: none; border: none; cursor: pointer; color: #64748b; font-size: 18px; line-height: 1; padding: 0; transition: color 0.15s ease; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 4px; }
    #ai-hint-bubble .ai-hint-close:hover { color: #e2e8f0; background: rgba(255, 255, 255, 0.06); }
    #ai-hint-bubble .ai-hint-body { font-size: 13.5px; color: #cbd5e1; line-height: 1.6; font-family: 'Poppins', sans-serif; }
    #ai-hint-bubble .ai-hint-footer { display: flex; align-items: center; gap: 6px; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(16, 185, 129, 0.15); }
    #ai-hint-bubble .ai-hint-pulse { width: 7px; height: 7px; background: #10b981; border-radius: 50%; flex-shrink: 0; animation: ai-hint-pulse 1.6s ease-in-out infinite; }
    @keyframes ai-hint-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(0.85); } }
    #ai-hint-bubble .ai-hint-footer-text { font-size: 11px; color: #475569; font-family: 'Fira Code', monospace; }
  `;
  document.head.appendChild(style);
}());

// 2. The Main Init Function
// ============================================
// AGENTIC AI INTERVIEW COMPANION LOGIC
// ============================================
function initAiInterviewer() {
    const editor = document.getElementById('codeEditor');
    
    if (!workspaceSocket && typeof io !== 'undefined') {
        workspaceSocket = io();
    }

    if (!editor || !workspaceSocket) {
        console.warn('AI Interviewer: editor or socket not ready', { editor: !!editor, socket: !!workspaceSocket });
        return;
    }

    // Debounce to prevent spamming API
    const sendLiveCodeToAi = debounce((code) => {
        if (!isAiInterviewerActive || code.trim().length < 10) return;
        const lang = document.getElementById('languageSelect')?.value || 'javascript';
        const problemTitle = currentProblem ? currentProblem.title : "Free Workspace";

        // Bot Fix: Removed userId completely to avoid PII leak
        workspaceSocket.emit('ai-evaluate-code', {
            code: code,
            language: lang,
            problem: problemTitle
        });
        console.log("🕵️‍♂️ Sent live code to AI Interviewer for analysis...");
    }, 2500);

    // Trigger on typing
    editor.addEventListener('input', (e) => {
        if (isAiInterviewerActive) {
            sendLiveCodeToAi(e.target.value);
        }
    });

    // Receive Claude's Beautiful Bubble
    workspaceSocket.on('ai-interviewer-feedback', (data) => {
        if (!data || !data.hint) return;

        const existing = document.getElementById('ai-hint-bubble');
        if (existing) existing.remove();

        const bubble = document.createElement('div');
        bubble.id = 'ai-hint-bubble';
        bubble.setAttribute('role', 'status');
        bubble.setAttribute('aria-live', 'polite');

        const hintText = document.createTextNode(data.hint);
        const hintSpan = document.createElement('span');
        hintSpan.appendChild(hintText);

        bubble.innerHTML = `
            <div class="ai-hint-header">
            <div class="ai-hint-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>
                AI Interviewer
            </div>
            <button class="ai-hint-close" aria-label="Dismiss hint">&#x2715;</button>
            </div>
            <div class="ai-hint-body"></div>
            <div class="ai-hint-footer">
            <div class="ai-hint-pulse"></div>
            <span class="ai-hint-footer-text">Observing your code live</span>
            </div>
        `;

        bubble.querySelector('.ai-hint-body').appendChild(hintSpan);

        // Inject inside modal, not body — fixes the "outside editor" bug
        const target = document.querySelector('.quiz-modal-content') 
                       || document.getElementById('quizEditorModal') 
                       || document.body;
        if (target !== document.body) {
            target.style.position = 'relative';
        }
        target.appendChild(bubble);

        const closeBtn = bubble.querySelector('.ai-hint-close');
        closeBtn.addEventListener('click', () => {
            bubble.classList.add('ai-hint-dismissing');
            bubble.addEventListener('animationend', () => bubble.remove(), { once: true });
        });

        const autoDismiss = setTimeout(() => {
            if (document.getElementById('ai-hint-bubble')) {
                bubble.classList.add('ai-hint-dismissing');
                bubble.addEventListener('animationend', () => bubble.remove(), { once: true });
            }
        }, 18000);

        closeBtn.addEventListener('click', () => clearTimeout(autoDismiss), { once: true });
    });
}

function toggleAiInterviewer() {
    isAiInterviewerActive = !isAiInterviewerActive;
    
    // Bot Fix: Sync Accessibility (aria-pressed) for screen readers
    const toggleBtn = document.getElementById('aiInterviewerToggle');
    if (toggleBtn) {
        toggleBtn.setAttribute('aria-pressed', isAiInterviewerActive.toString());
    }

    if (isAiInterviewerActive) {
        // Re-init if socket not ready yet
        if (!workspaceSocket && typeof io !== 'undefined') {
            workspaceSocket = io();
            initAiInterviewer();
        }
        showNotification("🤖 Agentic AI Interviewer is now observing your code.", "success");
        // Bot Fix: Removed the forced 'Test' emit completely. The real debounce will handle it now.
    } else {
        showNotification("🤖 Agentic AI Interviewer deactivated.", "info");
        // Also remove bubble if user turns off AI
        const existing = document.getElementById('ai-hint-bubble');
        if (existing) {
            existing.classList.add('ai-hint-dismissing');
            existing.addEventListener('animationend', () => existing.remove(), { once: true });
        }
    }
}
// ============================================
// LOADING SCREEN
// ============================================
function initLoadingScreen() {
  setTimeout(() => {
    const loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) loadingScreen.classList.add("hidden");
    initializeAnimations();
  }, 2000);
}

// ============================================
// NAVBAR
// ============================================
let scrollPosition = 0;

function lockBodyScroll() {
  scrollPosition = window.scrollY;

  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollPosition}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
}

function unlockBodyScroll() {
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";

  window.scrollTo(0, scrollPosition);
}

let navbarInitialized = false;

function initNavbar() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");
  if (!menuToggle || !navLinks || navbarInitialized) return;
  navbarInitialized = true;

  // Hide Home link on homepage
  const homeLink = document.querySelector('.nav-link[href="/index.html#home"]');
  if (homeLink) {
    const isHomePage = document.body.getAttribute('data-page') === 'index';
    homeLink.closest('.nav-item').style.display = isHomePage ? 'none' : '';
  }

  let overlay = document.querySelector(".nav-overlay");
  if (!overlay) { overlay = document.createElement("div"); overlay.className = "nav-overlay"; document.body.appendChild(overlay); }
  const toggleMenu = (open) => {
    const isOpen = open !== undefined ? open : !navLinks.classList.contains("active");
    navLinks.classList.toggle("active", isOpen);
    menuToggle.setAttribute("aria-expanded", isOpen);
    if (overlay) overlay.classList.toggle("active", isOpen);
    if (isOpen) {
      lockBodyScroll();
    } else {
      unlockBodyScroll();
    }
    const icon = menuToggle.querySelector("i");
    if (icon) { icon.classList.toggle("fa-bars", !isOpen); icon.classList.toggle("fa-times", isOpen); }
  };
  const closeMenu = () => { if (navLinks.classList.contains("active")) toggleMenu(false); };
  menuToggle.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(); });
  overlay.addEventListener("click", closeMenu);
  navLinks.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
  const dropdownToggles = document.querySelectorAll(".dropdown-toggle");
  const isMobile = () => window.matchMedia("(max-width: 1024px)").matches;
  dropdownToggles.forEach(toggle => {
    const parent = toggle.closest(".has-dropdown");
    const menu = parent?.querySelector(".dropdown-menu");
    if (!parent || !menu) return;
    let hoverTimeout;
    const showMenu = () => { clearTimeout(hoverTimeout); parent.classList.add("open"); toggle.setAttribute("aria-expanded", "true"); };
    const hideMenu = () => { hoverTimeout = setTimeout(() => { parent.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }, 250); };
    parent.addEventListener("mouseenter", () => { if (!isMobile()) showMenu(); });
    parent.addEventListener("mouseleave", () => { if (!isMobile()) hideMenu(); });
    toggle.addEventListener("focus", () => { if (!isMobile()) showMenu(); });
    parent.addEventListener("focusout", () => { if (!isMobile()) hideMenu(); });
    toggle.addEventListener("click", (e) => { if (isMobile()) { e.preventDefault(); e.stopPropagation(); const isOpen = parent.classList.toggle("open"); toggle.setAttribute("aria-expanded", isOpen); } });
    menu.querySelectorAll(".dropdown-item").forEach(item => { item.addEventListener("click", () => { if (isMobile()) { parent.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); } }); });
  });
  window.addEventListener("resize", () => {
    if (!isMobile()) {
      if (navLinks.classList.contains("active")) toggleMenu(false);
      document.querySelectorAll(".has-dropdown.open").forEach(el => el.classList.remove("open"));
      dropdownToggles.forEach(toggle => toggle.setAttribute("aria-expanded", "false"));
    }
  });
}

// ============================================
// HERO SECTION
// ============================================
function initHeroSection() {
  const typingElement = document.getElementById("typingText");
  if (!typingElement) return;
  const texts = ["Arrays", "Linked Lists", "Trees", "Graphs", "Dynamic Programming", "System Design"];
  let textIndex = 0, charIndex = 0, isDeleting = false;

  function typeEffect() {
    const currentText = texts[textIndex];
    if (isDeleting) { typingElement.textContent = currentText.substring(0, charIndex - 1); charIndex--; }
    else { typingElement.textContent = currentText.substring(0, charIndex + 1); charIndex++; }
    let typeSpeed = isDeleting ? 50 : 100;
    if (!isDeleting && charIndex === currentText.length) { typeSpeed = 2000; isDeleting = true; }
    else if (isDeleting && charIndex === 0) { isDeleting = false; textIndex = (textIndex + 1) % texts.length; typeSpeed = 500; }
    setTimeout(typeEffect, typeSpeed);
  }
  typeEffect();

  const statNumbers = document.querySelectorAll(".stat-number");
  const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { animateValue(entry.target); observer.unobserve(entry.target); } }); }, { threshold: 0.5 });
  statNumbers.forEach(stat => observer.observe(stat));
}

function animateValue(element) {
  const target = parseInt(element.getAttribute("data-target"));
  const duration = 2000;
  const increment = target / (duration / 16);
  let current = 0;
  const timer = setInterval(() => { current += increment; if (current >= target) { current = target; clearInterval(timer); } element.textContent = Math.ceil(current).toLocaleString(); }, 16);
}

// ============================================
// PROFILE
// ============================================
function initProfile() {
  const profileName = document.getElementById("profileName");
  if (profileName) profileName.textContent = userProgress.name;
  const joinDate = document.getElementById("joinDate");
  if (joinDate) {
    let joinDateObj = userProgress.joinDate ? new Date(userProgress.joinDate) : new Date();
    if (!userProgress.joinDate) { userProgress.joinDate = joinDateObj.toISOString(); saveUserData(); }
    joinDate.textContent = joinDateObj.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }
  const avatarIcon = document.querySelector('.avatar-icon');
  if (avatarIcon) avatarIcon.textContent = userProgress.avatar || '🚀';
  updateProfile();
}

function updateProfile() {
  const levelNames = ["Beginner", "Novice", "Intermediate", "Advanced", "Expert", "Master", "Grandmaster", "Legend"];
  const profileLevel = document.getElementById("profileLevel");
  if (profileLevel) profileLevel.textContent = `Level ${userProgress.level} - ${levelNames[userProgress.level - 1]}`;
  const profileLevelSection = document.getElementById("profileLevelSection");
  if (profileLevelSection) profileLevelSection.textContent = `Level ${userProgress.level} - ${levelNames[userProgress.level - 1]}`;
  const profileXP = document.getElementById("profileTotalXP");
  if (profileXP) profileXP.textContent = userProgress.xp.toLocaleString();
  const profileXPSection = document.getElementById("profileTotalXPSection");
  if (profileXPSection) profileXPSection.textContent = userProgress.xp.toLocaleString();
  const profileProblems = document.getElementById("profileProblems");
  if (profileProblems) profileProblems.textContent = userProgress.completedProblems.length;
  const profileProblemsSection = document.getElementById("profileProblemsSection");
  if (profileProblemsSection) profileProblemsSection.textContent = userProgress.completedProblems.length;
  const profileStreak = document.getElementById("profileStreak");
  if (profileStreak) profileStreak.textContent = userProgress.streak;
  const profileFreezes = document.getElementById("profileFreezes");
  if (profileFreezes) profileFreezes.textContent = userProgress.freezes || 0;
  const profileSectionStreak = document.getElementById("profileSectionStreak");
  if (profileSectionStreak) profileSectionStreak.textContent = userProgress.streak;
  const profileSectionFreezes = document.getElementById("profileSectionFreezes");
  if (profileSectionFreezes) profileSectionFreezes.textContent = userProgress.freezes || 0;
  const profileBadges = document.getElementById("profileBadges");
  if (profileBadges) {
    const badges = [userProgress.completedProblems.length >= 1, userProgress.streak >= 7, userProgress.xp >= 5000, userProgress.completedProblems.length >= 50, userProgress.completedProblems.length >= 100, userProgress.completedProblems.length >= 25 && userProgress.xp >= 2500].filter(Boolean).length;
    profileBadges.textContent = badges;
    const profileBadgesSection = document.getElementById("profileBadgesSection");
    if (profileBadgesSection) profileBadgesSection.textContent = badges;
  }
  document.querySelectorAll(".avatar-icon").forEach(el => el.textContent = userProgress.avatar || "🚀");
  updateLevelProgress();
}

function updateLevelProgress() {
  const levels = [0, 1000, 2500, 5000, 10000, 20000, 50000, 100000];
  const currentLevel = userProgress.level;
  const currentLevelXP = levels[Math.max(0, currentLevel - 1)];
  const nextLevelXP = levels[currentLevel] || 100000;
  const xpProgress = ((userProgress.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  const progressPercent = Math.min(Math.max(xpProgress, 0), 100);
  const progressBar = document.getElementById("profileProgressBar");
  if (progressBar) progressBar.style.width = progressPercent + "%";
  const progressLabel = document.getElementById("profileLevelProgress");
  if (progressLabel) progressLabel.textContent = Math.round(progressPercent) + "%";
  const progressBarSection = document.getElementById("profileProgressBarSection");
  if (progressBarSection) progressBarSection.style.width = progressPercent + "%";
  const progressLabelSection = document.getElementById("profileLevelProgressSection");
  if (progressLabelSection) progressLabelSection.textContent = Math.round(progressPercent) + "%";
}

// ============================================
// TOPICS
// ============================================
function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / (1000 * 60 * 60 * 24));
}

function getDailyTopic() { return dsaTopics[getDayOfYear() % dsaTopics.length]; }

function initTopicOfTheDay() {
  const topic = getDailyTopic();
  if (!topic) return;
  const totdIcon = document.getElementById("totdIcon");
  if (!totdIcon) return;
  totdIcon.textContent = topic.icon;
  const totdTitle = document.getElementById("totdTitle");
  if (totdTitle) totdTitle.textContent = topic.name;
  const totdDesc = document.getElementById("totdDesc");
  if (totdDesc) totdDesc.textContent = topic.description;
  const diffEl = document.getElementById("totdDifficulty");
  if (diffEl) {
    diffEl.textContent = topic.difficulty;
    diffEl.className = `totd-difficulty difficulty-badge ${getDifficultyClass(topic.difficulty)}`;
  }
  const progress = getTopicProgress(topic.name);
  const totdProblems = document.getElementById("totdProblems");
  if (totdProblems) totdProblems.textContent = `${progress.completed}/${progress.total} solved`;
  const totdBtn = document.getElementById("totdBtn");
  if (totdBtn) totdBtn.addEventListener("click", () => openTopicModal(topic));
}

function getTopicProgress(topicName) {
  const categoryMap = { Arrays: "arrays", Strings: "strings", "Linked List": "linkedlist", Trees: "trees", Graphs: "graphs", "Dynamic Programming": "dp" };
  const category = categoryMap[topicName];
  if (!category) return { completed: 0, total: 0, percentage: 0 };
  const topicProblems = practiceProblems.filter(p => p.category === category);
  const total = topicProblems.length;
  if (total === 0) return { completed: 0, total: 0, percentage: 0 };
  const completed = topicProblems.filter(p => userProgress.completedProblems.includes(p.id)).length;
  return { completed, total, percentage: Math.round((completed / total) * 100) };
}

function initTopicsSection() {
  const topicsGrid = document.querySelector(".topics-grid");
  if (!topicsGrid) return;
  topicsGrid.innerHTML = "";
  dsaTopics.forEach((topic, index) => {
    const card = document.createElement("div");
    card.className = "topic-card animate-in";
    card.style.animationDelay = `${index * 0.1}s`;
    const progress = getTopicProgress(topic.name);
    card.innerHTML = `<div class="topic-icon">${topic.icon}</div><h3 class="topic-name">${topic.name}</h3><p class="topic-desc">${topic.description}</p><div class="topic-meta"><span class="difficulty-badge ${getDifficultyClass(topic.difficulty)}">${topic.difficulty}</span><span class="topic-count">${progress.total} problems</span></div><div class="topic-mastery"><div class="mastery-header"><span class="mastery-label">Progress</span><span class="mastery-stats">${progress.completed}/${progress.total} solved</span></div><div class="mastery-bar"><div class="mastery-fill" style="width: ${progress.percentage}%"></div></div><span class="mastery-percentage">${progress.percentage}%</span></div>`;
    topicsGrid.appendChild(card);
    card.addEventListener("click", () => openTopicModal(topic));
  });
}

function getDifficultyClass(difficulty) {
  const d = difficulty.toLowerCase();
  if (d.includes("easy")) return "easy";
  if (d.includes("medium")) return "medium";
  if (d.includes("hard")) return "hard";
  return "medium";
}

function openTopicModal(topic) {
  const modal = document.getElementById("topicModal");
  if (!modal) return;
  const modalTitle = document.getElementById("modalTitle");
  if (modalTitle) modalTitle.textContent = topic.name;
  const modalTheory = document.getElementById("modalTheory");
  if (modalTheory) modalTheory.innerHTML = topic.theory;
  const modalDifficulty = document.getElementById("modalDifficulty");
  if (modalDifficulty) modalDifficulty.innerHTML = `<span class="difficulty-badge ${getDifficultyClass(topic.difficulty)}">${topic.difficulty}</span>`;
  const problemsList = document.getElementById("modalProblems");
  if (problemsList) {
    problemsList.innerHTML = topic.problems
      .map(
        (p) => `
        <li style="list-style:none; margin:0.4rem 0;">
          <button
            type="button"
            class="sample-problem-item"
            data-problem-name="${p.replace(/"/g, "&quot;")}"
            style="width:100%; text-align:left; cursor:pointer; padding:0.6rem 1rem; border-radius:8px; border:1px solid var(--glass-border); transition:all 0.2s ease;"
          >${p}</button>
        </li>`
      )
      .join("");

    problemsList.querySelectorAll(".sample-problem-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectSampleProblem(btn, btn.dataset.problemName || "");
      });
    });
  }
  const startBtn = document.getElementById("startPracticeBtn");
  if (startBtn) {
    startBtn.textContent = "Start Practicing";
    startBtn.onclick = () => {
      const selected = document.querySelector(".selected-problem");
      const problemName = selected ? selected.textContent.trim() : null;
      closeTopicModal();
      const practice = document.getElementById("practice");
      if (practice) practice.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => {
        const match = practiceProblems.find(p => p.title.toLowerCase() === (problemName || "").toLowerCase());
        if (match) openQuizEditor(match);
      }, 600);
    };
  }
  modal.classList.add("active");
}

function selectSampleProblem(el, problemName) {
  document.querySelectorAll(".sample-problem-item").forEach(item => { item.classList.remove("selected-problem"); item.style.background = ""; item.style.color = ""; item.style.border = "1px solid var(--glass-border)"; });
  el.classList.add("selected-problem");
  el.style.background = "var(--primary)";
  el.style.color = "var(--dark-bg)";
  el.style.border = "1px solid var(--primary)";
  const practiceBtn = document.getElementById("startPracticeBtn");
  if (practiceBtn) practiceBtn.textContent = `Start Practicing: ${problemName}`;
}

function closeTopicModal() { const el = document.getElementById("topicModal"); if (el) el.classList.remove("active"); }

function getQuizTopicKey(topic) {
  const normalize = s => String(s).trim().toLowerCase().replace(/\s+/g, " ");
  const map = { arrays: "arrays", strings: "strings", "linked list": "linkedlist", linkedlist: "linkedlist", trees: "trees", graphs: "graphs", "dynamic programming": "dp", dp: "dp" };
  if (typeof topic === "string") return map[normalize(topic)] || null;
  const name = normalize(topic.name);
  return map[name] || null;
}

// ============================================
// QUIZ SECTION
// ============================================
function initQuizSection() {
  const quizGrid = document.querySelector(".quiz-grid");
  if (!quizGrid) { console.warn("Quiz grid element not found"); return; }
  quizGrid.innerHTML = "";
  dsaTopics.forEach((topic, index) => {
    const topicKey = getQuizTopicKey(topic);
    if (!topicKey) return;
    const card = document.createElement("div");
    card.className = "quiz-card animate-in";
    card.style.animationDelay = `${index * 0.1}s`;
    card.innerHTML = `<div class="quiz-card-icon">${topic.icon}</div><h3 class="quiz-card-title">${topic.name}</h3><p class="quiz-card-desc">Test your knowledge with 10 unique questions</p><div class="quiz-card-meta"><span class="quiz-count">10 Questions</span><span class="quiz-difficulty ${getDifficultyClass(topic.difficulty)}">${topic.difficulty}</span></div><div class="quiz-progress-bar"><div class="quiz-progress-fill" id="progress-${topicKey}"></div></div><div class="quiz-stats"><span>Best: <strong id="best-${topicKey}">--</strong></span><span>Attempts: <strong id="attempts-${topicKey}">0</strong></span></div><button class="btn btn-primary start-quiz-btn" data-topic="${topicKey}"><i class="fas fa-play"></i> Start Quiz</button>`;
    quizGrid.appendChild(card);
    card.addEventListener("click", () => startQuiz(topicKey));
    const startBtn = card.querySelector(".start-quiz-btn");
    if (startBtn) startBtn.addEventListener("click", (e) => { e.stopPropagation(); startQuiz(topicKey); });
    updateQuizProgressDisplay(topic);
  });
}

function updateQuizProgressDisplay(topic) {
  const topicKey = getQuizTopicKey(topic);
  const progressFill = document.getElementById(`progress-${topicKey}`);
  const bestScoreEl = document.getElementById(`best-${topicKey}`);
  const attemptsEl = document.getElementById(`attempts-${topicKey}`);
  if (!progressFill || !bestScoreEl || !attemptsEl) return;
  const quizData = userProgress.quizScores[topicKey] || { bestScore: 0, attempts: 0, totalXP: 0 };
  progressFill.style.width = `${quizData.attempts > 0 ? 100 : 0}%`;
  bestScoreEl.textContent = `${quizData.bestScore}%`;
  attemptsEl.textContent = quizData.attempts;
}

// ============================================
// QUIZ MODAL
// ============================================
let currentQuiz = null;
let lastQuizReview = null;
let lastQuizResultData = null;
let quizStartTime = null;
let quizTimerInterval = null;
let currentNotesProblemId = null;
let tQuiz = null;

function startQuiz(topic) {
  const topicKey = getQuizTopicKey(topic);
  const questions = quizQuestions[topicKey];
  if (!questions || questions.length === 0) { showNotification('No quiz questions available!', 'error'); return; }
  const resultEl = document.getElementById("topicQuizResult");
  if (resultEl) { resultEl.classList.add("hidden"); resultEl.innerHTML = ""; }
  const qText = document.getElementById("topicQuizQuestionText");
  if (qText) qText.style.display = "block";
  const qOpts = document.getElementById("topicQuizOptions");
  if (qOpts) qOpts.style.display = "block";
  const qProg = document.getElementById("topicQuizProgress");
  if (qProg) qProg.style.display = "block";
  const qCount = document.getElementById("topicQuizCounter");
  if (qCount) qCount.style.display = "block";
  currentQuiz = { topic: topicKey, questions: shuffleArray([...questions]), currentQuestionIndex: 0, score: 0, answers: [] };
  openQuizModal();
  startQuizTimer(topicKey);
  renderQuizQuestion();
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; }
  return array;
}

function startQuizTimer(topicKey) {
  clearInterval(quizTimerInterval);
  quizStartTime = Date.now();
  updateQuizTimerDisplay(topicKey);
  quizTimerInterval = setInterval(() => updateQuizTimerDisplay(topicKey), 1000);
}

function stopQuizTimer() { clearInterval(quizTimerInterval); return Math.floor((Date.now() - quizStartTime) / 1000); }

function updateQuizTimerDisplay(topicKey) {
  const timerEl = document.getElementById("quizTimer");
  const bestTimeEl = document.getElementById("bestQuizTime");
  if (!timerEl || !bestTimeEl) return;
  const elapsed = Math.floor((Date.now() - quizStartTime) / 1000);
  timerEl.textContent = formatQuizTime(elapsed);
  const bestTime = userProgress.bestQuizTimes[topicKey];
  bestTimeEl.textContent = bestTime ? formatQuizTime(bestTime) : "--:--";
}

function formatQuizTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function openQuizModal() {
  const modal = document.getElementById("quizModal");
  if (modal) modal.classList.add("active");
}

function closeQuizModal() {
  const modal = document.getElementById("quizModal");
  if (modal) modal.classList.remove("active");
  const resultEl = document.getElementById("topicQuizResult");
  if (resultEl) { resultEl.classList.add("hidden"); resultEl.innerHTML = ""; }
  clearInterval(quizTimerInterval);
  currentQuiz = null;
}

function renderQuizQuestion() {
  if (!currentQuiz || currentQuiz.currentQuestionIndex >= currentQuiz.questions.length) { finishQuiz(); return; }
  const question = currentQuiz.questions[currentQuiz.currentQuestionIndex];
  const questionEl = document.getElementById("topicQuizQuestionText");
  const optionsEl = document.getElementById("topicQuizOptions");
  const progressEl = document.getElementById("topicQuizProgress");
  const counterEl = document.getElementById("topicQuizCounter");
  if (questionEl) questionEl.textContent = `Q${currentQuiz.currentQuestionIndex + 1}: ${question.question}`;
  if (counterEl) counterEl.textContent = `${currentQuiz.currentQuestionIndex + 1} / ${currentQuiz.questions.length}`;
  if (progressEl) progressEl.style.width = `${((currentQuiz.currentQuestionIndex + 1) / currentQuiz.questions.length) * 100}%`;
  if (optionsEl) {
    optionsEl.innerHTML = question.options.map((option, idx) => `<div class="quiz-option" data-index="${idx}"><span class="option-letter">${String.fromCharCode(65 + idx)}</span><span class="option-text">${option}</span></div>`).join("");
    optionsEl.querySelectorAll(".quiz-option").forEach(opt => opt.addEventListener("click", () => selectQuizAnswer(parseInt(opt.dataset.index))));
  }
}

function selectQuizAnswer(selectedIndex) {
  clearInterval(quizTimerInterval);
  const question = currentQuiz.questions[currentQuiz.currentQuestionIndex];
  const isCorrect = selectedIndex === question.correct;
  currentQuiz.answers.push({ questionId: question.id, selected: selectedIndex, correct: question.correct, isCorrect: isCorrect });
  if (isCorrect) currentQuiz.score++;
  const optionsEl = document.getElementById("topicQuizOptions");
  if (!optionsEl) return;
  optionsEl.querySelectorAll(".quiz-option").forEach((opt, idx) => {
    opt.classList.add("selected");
    if (idx === question.correct) opt.classList.add("correct");
    else if (idx === selectedIndex && !isCorrect) opt.classList.add("incorrect");
    opt.style.pointerEvents = "none";
  });
  setTimeout(() => { currentQuiz.currentQuestionIndex++; renderQuizQuestion(); }, 1200);
}

function finishQuiz() {
  const topicKey = currentQuiz.topic;
  const score = currentQuiz.score;
  const total = currentQuiz.questions.length;
  const percentage = Math.round((score / total) * 100);
  const completionTime = stopQuizTimer();
  if (!userProgress.quizScores[topicKey]) userProgress.quizScores[topicKey] = { bestScore: 0, attempts: 0, totalXP: 0 };
  const record = userProgress.quizScores[topicKey];
  if (!userProgress.bestQuizTimes[topicKey] || completionTime < userProgress.bestQuizTimes[topicKey]) userProgress.bestQuizTimes[topicKey] = completionTime;
  record.attempts++;
  if (percentage > record.bestScore) record.bestScore = percentage;
  const xpEarned = Math.round(score * 10);
  addXP(xpEarned);
  record.totalXP += xpEarned;
  recordAnalyticsEvent("quiz", { topicKey, score, total, percentage, xpEarned, completionTime });
  recordDailyActivity(1);
  if (typeof handleQuizCompletionForRevision === "function") handleQuizCompletionForRevision(topicKey, percentage);
  saveUserData();
  const qText = document.getElementById("topicQuizQuestionText");
  if (qText) qText.style.display = "none";
  const qOpts = document.getElementById("topicQuizOptions");
  if (qOpts) qOpts.style.display = "none";
  lastQuizReview = JSON.parse(JSON.stringify(currentQuiz));
  lastQuizResultData = { score, total, percentage, xpEarned, completionTime };
  const resultEl = document.getElementById("topicQuizResult");
  if (resultEl) resultEl.classList.remove("hidden");
  showQuizResults(score, total, percentage, xpEarned, completionTime);
  const qProg = document.getElementById("topicQuizProgress");
  if (qProg) qProg.style.display = "none";
  const qCount = document.getElementById("topicQuizCounter");
  if (qCount) qCount.style.display = "none";
  updateQuizProgressDisplay(topicKey);
  updateDashboard();
  updateGamification();
}

function showQuizResults(score, total, percentage, xpEarned, completionTime) {
  const resultEl = document.getElementById("topicQuizResult");
  if (!resultEl) return;
  resultEl.classList.remove("hidden");
  let icon = "", message = "";
  if (percentage >= 90) { icon = "🏆"; message = "Outstanding! Perfect mastery!"; }
  else if (percentage >= 70) { icon = "🌟"; message = "Great job! Solid understanding!"; }
  else if (percentage >= 50) { icon = "👍"; message = "Good effort! Keep practicing!"; }
  else { icon = "📚"; message = "Keep learning! Review the topic and try again!"; }
  resultEl.innerHTML = `<div class="quiz-result-content"><div class="quiz-result-icon">${icon}</div><h3>${message}</h3><div class="quiz-score-circle"><span class="score-number">${percentage}%</span></div><p>You got <strong>${score}</strong> out of <strong>${total}</strong> questions correct</p><p class="xp-gained">+${xpEarned} XP earned!</p><p class="completion-time">Completion Time: ${formatQuizTime(completionTime)}</p></div>`;
  resultEl.innerHTML += `<button class="btn btn-primary review-btn" onclick="showQuizReview()">📖 Review Answers</button>`;
}

function showQuizReview() {
  if (!lastQuizReview || !lastQuizReview.questions || !lastQuizReview.answers) { showNotification("No review data found", "error"); return; }
  const resultEl = document.getElementById("topicQuizResult");
  const escapeHtml = (value = "") =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&`#39`;");

  // Ensure layout doesn't cut off items: keep scrollable container, and avoid nested flex issues.
  let html = `<div class="quiz-review"><h2>📖 Quiz Review</h2><div class="quiz-review-container"><div class="quiz-review-items">`;
  lastQuizReview.questions.forEach((q, index) => {
    const answer = lastQuizReview.answers[index] || {};
    const yourAnswerText = answer.selected !== undefined ? q.options[answer.selected] : "Not Answered";
    const correctnessIcon = answer.isCorrect ? "✅" : "❌";
    html += `<div class="review-item"><h4>Q${index + 1}. ${escapeHtml(q.question)}</h4><p><strong>Your Answer:</strong> ${escapeHtml(yourAnswerText)} ${correctnessIcon}</p><p class="correct-answer"><strong>Correct Answer:</strong> ${escapeHtml(q.options[q.correct])}</p><p><strong>Explanation:</strong> ${escapeHtml(q.explanation)}</p></div>`;
  });
  html += `</div></div><div class="quiz-actions" style="border-top:none; justify-content:space-between; padding-top:1.25rem; background:transparent;">
    <button class="btn btn-primary" onclick="restoreQuizResults()">Back</button>
    <button class="btn btn-secondary" onclick="closeQuizModal()">Close</button>
  </div></div>`;
  resultEl.innerHTML = html;
  // If the user re-opens review, scroll to the top of the review list.
  const container = resultEl.querySelector('.quiz-review-container');
  if (container) container.scrollTop = 0;
}


function restoreQuizResults() {
  if (!lastQuizResultData) return;
  showQuizResults(lastQuizResultData.score, lastQuizResultData.total, lastQuizResultData.percentage, lastQuizResultData.xpEarned, lastQuizResultData.completionTime);
}

// ============================================
// PRACTICE SECTION - PAGINATION FIXED
// ============================================
function initPracticeSection() {
  if (window.__practiceInitialized) return;
  window.__practiceInitialized = true;
  const problemsGrid = document.querySelector(".problems-grid");
  if (!problemsGrid) return;

  // Notes modal
  const notesCloseBtn = document.getElementById("notesModalClose");
  const notesSaveBtn = document.getElementById("notesSaveBtn");
  const notesModal = document.getElementById("notesModal");
  if (notesCloseBtn) notesCloseBtn.addEventListener("click", closeNotesModal);
  if (notesSaveBtn) notesSaveBtn.addEventListener("click", saveProblemNotes);
  if (notesModal) notesModal.addEventListener("click", (e) => { if (e.target === notesModal) closeNotesModal(); });

  // Filter buttons
  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      currentPage = 1;
      renderProblems();
    });
  });

  // AI Recommend Button
  const aiRecommendBtn = document.getElementById("ai-recommend-btn");
  if (aiRecommendBtn) {
    aiRecommendBtn.addEventListener("click", async () => {
      try {
        aiRecommendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Finding...';
        aiRecommendBtn.disabled = true;
        
        const res = await fetch("/api/recommendations/next", { credentials: "include" });
        if (res.status === 401) {
           alert("Please log in to get AI recommendations.");
           return;
        }
        const data = await res.json();
        
        if (data.success && data.recommendation) {
           const rec = data.recommendation;
           currentFilter = rec.topic.toLowerCase();
           currentPage = 1;
           
           filterButtons.forEach((b) => {
             if(b.dataset.filter === currentFilter) b.classList.add("active");
             else b.classList.remove("active");
           });
           
           renderProblems();
           alert("AI Recommendation: " + rec.reason + "\n\n" + (rec.aiTip || ""));
        } else {
           alert("Could not get recommendation.");
        }
      } catch (err) {
         console.error("AI recommend error:", err);
         alert("Failed to fetch recommendation.");
      } finally {
         aiRecommendBtn.innerHTML = '<i class="fas fa-magic"></i> AI Recommend Next';
         aiRecommendBtn.disabled = false;
      }
    });
  }

  // Search bar
  const searchInput = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearSearchBtn");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearch = e.target.value.toLowerCase();
      currentPage = 1;
      renderProblems();
      if (currentSearch.length > 0) clearBtn.classList.add("visible");
      else clearBtn.classList.remove("visible");
    });
  }
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      currentSearch = "";
      clearBtn.classList.remove("visible");
      currentPage = 1;
      renderProblems();
      searchInput.focus();
    });
  }

  // Init pagination events
  initPaginationEvents();

  // Initial render
  renderProblems();
}

// ============================================
// PAGINATION CONFIGURATION
// ============================================
const PROBLEMS_PER_PAGE = 6;
let currentPage = 1;
let currentFilter = 'all';
let currentSearch = '';
let paginationInitialized = false;

let lastFilteredCacheKey = "";
let lastFilteredProblems = [];

function getFilteredProblems() {
  if (!window.dsaSearchEngine && typeof DSASearchEngine !== 'undefined') {
    window.dsaSearchEngine = new DSASearchEngine(practiceProblems);
  }

  let filtered = practiceProblems;
  if (currentSearch && window.dsaSearchEngine) {
    filtered = window.dsaSearchEngine.search(currentSearch);
  } else if (currentSearch) {
    // Fallback if searchEngine is somehow not loaded
    const searchLower = currentSearch.toLowerCase();
    filtered = filtered.filter(p => p.title.toLowerCase().includes(searchLower) || p.tags.some(tag => tag.toLowerCase().includes(searchLower)));
  }
  if (currentFilter !== 'all') {
    if (currentFilter === 'favorites') filtered = filtered.filter(p => userProgress.favoriteProblems.includes(p.id));
    else filtered = filtered.filter(p => p.difficulty === currentFilter);
  }
  return filtered;
}

function renderProblems() {
  const filtered = getFilteredProblems();
  const totalProblems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalProblems / PROBLEMS_PER_PAGE));

  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * PROBLEMS_PER_PAGE;
  const end = Math.min(start + PROBLEMS_PER_PAGE, totalProblems);
  const pageProblems = filtered.slice(start, end);

  const visibleCountEl = document.getElementById('visible-count');
  const totalCountEl = document.getElementById('total-count');
  if (visibleCountEl) visibleCountEl.textContent = pageProblems.length;
  if (totalCountEl) totalCountEl.textContent = totalProblems;

  renderProblemCards(pageProblems);
  updatePaginationControls(currentPage, totalPages);
}

function renderProblemCards(problems) {
  const problemsGrid = document.querySelector(".problems-grid");
  if (!problemsGrid) return;

  const cpType = userProgress.codingPersonality ? userProgress.codingPersonality.type : "brute-force first";

  const html = problems.map(problem => {
    let isRec = false, recLabel = "";
    if (cpType === "brute-force first") {
      if (problem.difficulty === "easy" || problem.tags.includes("Arrays")) { isRec = true; recLabel = "Plan First!"; }
    } else if (cpType === "over-optimizer") {
      if (problem.difficulty === "hard" || problem.tags.includes("Dynamic Programming") || problem.tags.includes("Hash Table")) { isRec = true; recLabel = "Optimize Metrics"; }
    } else if (cpType === "slow but accurate") {
      if (problem.difficulty === "medium") { isRec = true; recLabel = "Speed Practice"; }
    } else if (cpType === "greedy thinker") {
      if (problem.tags.includes("Greedy") || problem.tags.includes("Divide and Conquer") || problem.tags.includes("Recursion")) { isRec = true; recLabel = "Heuristic Check"; }
    }
    const recBadge = isRec ? `<span class="rec-personality-badge"><i class="fas fa-brain"></i> ${recLabel}</span>` : "";
    const isCompleted = userProgress.completedProblems.includes(problem.id);
    const isFavorite = userProgress.favoriteProblems.includes(problem.id);
    const hasNotes = userProgress.problemNotes && userProgress.problemNotes[problem.id];

    const displayTitle = problem.highlightedTitle || problem.title;
    const snippetHtml = problem.highlightedDescription ? `<div class="problem-snippet" style="font-size: 0.85em; color: var(--text-secondary); margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${problem.highlightedDescription}</div>` : "";

    return `<div class="problem-card animate-in" data-id="${problem.id}"><div class="problem-header"><h3 class="problem-title">${recBadge}${displayTitle}</h3><div class="problem-actions"><button class="favorite-btn ${isFavorite ? 'active' : ''}" data-id="${problem.id}" aria-label="Favorite problem"><i class="fas fa-heart"></i></button><button class="notes-btn ${hasNotes ? 'has-notes' : ''}" data-id="${problem.id}" aria-label="Problem notes"><i class="fas fa-sticky-note"></i></button><span class="difficulty-badge ${problem.difficulty}">${problem.difficulty}</span></div></div>${snippetHtml}<div class="problem-tags">${problem.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}</div><div class="problem-meta"><span class="acceptance-rate"><i class="fas fa-users"></i> ${problem.acceptance} acceptance</span>${isCompleted ? '<span class="completed-badge"><i class="fas fa-check"></i> Completed</span>' : ''}</div></div>`;
  }).join("");

  problemsGrid.innerHTML = html;

  if (!problemsGrid.dataset.listenersAttached) {
    attachProblemGridEventDelegation(problemsGrid);
    problemsGrid.dataset.listenersAttached = "true";
  }
}

// Attach event listeners once using delegation
function attachProblemGridEventDelegation(grid) {
  if (!grid) return;

  grid.addEventListener("click", (e) => {
    const favoriteBtn = e.target.closest(".favorite-btn");
    if (favoriteBtn && grid.contains(favoriteBtn)) {
      e.stopPropagation();
      e.preventDefault();
      const problemId = parseInt(favoriteBtn.dataset.id);
      toggleFavorite(problemId);
      renderProblems();
      return;
    }

    const notesBtn = e.target.closest(".notes-btn");
    if (notesBtn && grid.contains(notesBtn)) {
      e.stopPropagation();
      e.preventDefault();
      const problemId = parseInt(notesBtn.dataset.id);
      currentNotesProblemId = problemId;
      openNotesModal(problemId);
      return;
    }

    const card = e.target.closest(".problem-card");
    if (card && grid.contains(card)) {
      const problemId = parseInt(card.dataset.id);
      handleProblemClick(problemId);
    }
  });
}


// Legacy: addProblemCardEventListeners kept for compatibility, but no longer used
function addProblemCardEventListeners(grid) {
  grid.querySelectorAll(".favorite-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const problemId = parseInt(btn.dataset.id);
      toggleFavorite(problemId);
      renderProblems();
    });
  });
  grid.querySelectorAll(".notes-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const problemId = parseInt(btn.dataset.id);
      currentNotesProblemId = problemId;
      openNotesModal(problemId);
    });
  });
  grid.querySelectorAll(".problem-card").forEach((card) => {
    card.addEventListener("click", () => {
      const problemId = parseInt(card.dataset.id);
      handleProblemClick(problemId);
    });
  });
}

// Update pagination controls
function updatePaginationControls(page, totalPages) {
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');
  const info = document.getElementById('paginationInfo');
  if (prevBtn) prevBtn.disabled = page <= 1;
  if (nextBtn) nextBtn.disabled = page >= totalPages;
  if (info) info.textContent = `Page ${page} of ${totalPages}`;
}

// Change page
function changePage(delta) {
  const filtered = getFilteredProblems();
  const totalPages = Math.max(1, Math.ceil(filtered.length / PROBLEMS_PER_PAGE));
  const newPage = currentPage + delta;
  if (newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage;
    renderProblems();
    document.getElementById('practice')?.scrollIntoView({ behavior: 'smooth' });
  }
}

// Init pagination events
function initPaginationEvents() {
  if (paginationInitialized) return;
  paginationInitialized = true;
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');
  if (prevBtn) prevBtn.addEventListener('click', () => changePage(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => changePage(1));
}

// ============================================
// TOGGLE FAVORITE
// ============================================
function toggleFavorite(problemId) {
  const idx = userProgress.favoriteProblems.indexOf(problemId);
  if (idx > -1) { userProgress.favoriteProblems.splice(idx, 1); showNotification("Removed from favorites 💔", "info"); }
  else { userProgress.favoriteProblems.push(problemId); showNotification("Added to favorites ❤️", "success"); }
  saveUserData();
}

// ============================================
// NOTES
// ============================================
function openNotesModal(problemId) {
  currentNotesProblemId = problemId;
  const modal = document.getElementById("notesModal");
  const textarea = document.getElementById("problemNotesInput");
  if (!modal || !textarea) return;
  textarea.value = userProgress.problemNotes[problemId] || "";
  modal.classList.add("active");
}

function closeNotesModal() {
  const el = document.getElementById("notesModal");
  if (el) el.classList.remove("active");
}

function saveProblemNotes() {
  const input = document.getElementById("problemNotesInput");
  if (!input) return;
  const note = input.value.trim();
  if (currentNotesProblemId !== null) {
    userProgress.problemNotes[currentNotesProblemId] = note;
    saveUserData();
    showNotification("Notes saved successfully 📝", "success");
  }
  closeNotesModal();
}

// ============================================
// HANDLE PROBLEM CLICK
// ============================================
function handleProblemClick(problemId) {
  const problem = practiceProblems.find(p => p.id === problemId);
  if (problem) { openQuizEditor(problem); addRecentProblem(problemId); }
}

function addRecentProblem(problemId) {
  if (!userProgress.recentProblems) userProgress.recentProblems = [];
  userProgress.recentProblems = userProgress.recentProblems.filter(id => id !== problemId);
  userProgress.recentProblems.unshift(problemId);
  if (userProgress.recentProblems.length > 5) userProgress.recentProblems.pop();
  saveUserData();
}

// ============================================
// ROADMAP - (truncated for brevity, keep existing)
// ============================================
const roadmapSteps = [
  { id: 1, title: "Complexity Analysis & Big O", icon: "fa-stopwatch", desc: "Master variables, loops, conditionals, and learn how to analyze algorithm efficiency using Big-O notation.", theory: `<p><strong>Introduction to Algorithm Analysis:</strong> Before writing code, you must understand how to measure its efficiency. Complexity analysis allows you to evaluate how an algorithm scales as the input size grows.</p><p><strong>Big-O Notation:</strong> Big-O ($O(f(n))$) describes the upper bound of execution time or memory space in the worst-case scenario.</p><p><strong>Common Time Complexities:</strong></p><ul><li><strong>O(1) - Constant:</strong> Operation takes the same amount of time regardless of input size.</li><li><strong>O(log N) - Logarithmic:</strong> The problem size is divided in half at each step (e.g., Binary Search).</li><li><strong>O(N) - Linear:</strong> Time increases proportionally with input size.</li><li><strong>O(N log N) - Linearithmic:</strong> Efficient sorting algorithms.</li><li><strong>O(N²) - Quadratic:</strong> Nested loops over the input.</li></ul><p><strong>Space Complexity:</strong> The amount of memory an algorithm needs relative to the input size.</p>`, type: "quiz", quiz: [{ question: "What is the time complexity of searching for an element in an unsorted array of size N?", options: ["O(1)", "O(log N)", "O(N)", "O(N^2)"], correct: 2, explanation: "In an unsorted array, you may need to scan every element in the worst case, taking O(N) time." }, { question: "If an algorithm divides the problem size in half at each step, what is its time complexity?", options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"], correct: 1, explanation: "Dividing the problem size in half repeatedly yields a logarithmic complexity of O(log N)." }, { question: "What is the space complexity of an algorithm that creates a new array of size N?", options: ["O(1)", "O(log N)", "O(N)", "O(N^2)"], correct: 2, explanation: "Creating a new structure that grows linearly with the input size N requires O(N) auxiliary space." }], complexity: [{ op: "Array Access (by index)", time: "O(1)", space: "O(1)" }, { op: "Linear Search", time: "O(N)", space: "O(1)" }, { op: "Binary Search", time: "O(log N)", space: "O(1)" }, { op: "Nested Loops (i, j to N)", time: "O(N^2)", space: "O(1)" }] },
  { id: 2, title: "Arrays & Array Manipulation", icon: "fa-chart-simple", desc: "Understand contiguous memory, indexing, array traversal, and two-pointer techniques.", theory: `<p><strong>What is an Array?</strong> An array is a collection of elements stored in contiguous memory locations.</p><p><strong>Common Array Operations:</strong></p><ul><li><strong>Access:</strong> O(1)</li><li><strong>Search:</strong> O(N)</li><li><strong>Insertion / Deletion:</strong> O(N)</li></ul><p><strong>Two-Pointers Technique:</strong> A popular optimization pattern where two pointers traverse the array from different positions.</p>`, type: "coding", problems: [21, 17, 1], complexity: [{ op: "Access element by index", time: "O(1)", space: "O(1)" }, { op: "Insert/Delete at start", time: "O(N)", space: "O(1)" }, { op: "Search element (linear)", time: "O(N)", space: "O(1)" }, { op: "Two-pointer search", time: "O(N)", space: "O(1)" }] },
  { id: 3, title: "Strings & Pattern Matching", icon: "fa-font", desc: "Learn character encoding, string reversal, anagrams, and sliding window basics.", theory: `<p><strong>What is a String?</strong> A string is a sequence of characters.</p><p><strong>Key String Concepts:</strong></p><ul><li><strong>Palindromes:</strong> Strings that read the same backwards.</li><li><strong>Anagrams:</strong> Rearrangement of characters to form another word.</li><li><strong>Substring vs Subsequence:</strong> A substring is contiguous; a subsequence is non-contiguous but maintains order.</li></ul>`, type: "coding", problems: [18, 2], complexity: [{ op: "Read character by index", time: "O(1)", space: "O(1)" }, { op: "String concatenation", time: "O(N + M)", space: "O(N + M)" }, { op: "Anagram check (Hash Map)", time: "O(N)", space: "O(k) where k <= 256" }] },
  { id: 4, title: "Recursion Fundamentals", icon: "fa-rotate", desc: "Master the call stack, base cases, and solving problems recursively.", theory: `<p><strong>What is Recursion?</strong> Recursion is a programming technique where a function calls itself.</p><p><strong>The Two Golden Rules:</strong></p><ol><li><strong>Base Case:</strong> The termination condition.</li><li><strong>Recursive Step:</strong> The logic that progresses towards the base case.</li></ol><p><strong>The Call Stack:</strong> Each recursive call pushes a new frame onto the stack.</p>`, type: "quiz", quiz: [{ question: "What is the purpose of the 'base case' in a recursive function?", options: ["To trigger the recursive call", "To provide a terminating condition that stops recursion", "To optimize the loop runtime", "To clear call stack memory"], correct: 1, explanation: "The base case is crucial to stop the recursive cycle." }, { question: "What happens if a recursive function never reaches its base case?", options: ["It returns undefined immediately", "It converts into a fast iterative loop", "It crashes with a stack overflow error", "It completes in constant space O(1)"], correct: 2, explanation: "Infinite recursion adds frames to the call stack until it exceeds its limit." }, { question: "Which data structure is internally used to track recursive calls?", options: ["Queue", "Stack", "Heap", "Tree"], correct: 1, explanation: "The LIFO Call Stack manages recursion contexts." }], complexity: [{ op: "Factorial/Fibonacci depth", time: "O(N) or O(2^N)", space: "O(N) (call stack)" }, { op: "Binary search recursive", time: "O(log N)", space: "O(log N) (call stack)" }] },
  { id: 5, title: "Linked Lists (Singly & Doubly)", icon: "fa-link", desc: "Build dynamic structures, manipulate node pointers, and detect cycles.", theory: `<p><strong>What is a Linked List?</strong> Each element (node) contains its value and a pointer to the next node.</p><p><strong>Why use Linked Lists?</strong> They allow O(1) time insertions and deletions at any point.</p><p><strong>Key Operations:</strong></p><ul><li><strong>Access / Search:</strong> O(N)</li><li><strong>Insertion / Deletion:</strong> O(1)</li></ul>`, type: "coding", problems: [10, 3], complexity: [{ op: "Access / Search item", time: "O(N)", space: "O(1)" }, { op: "Insert at head / tail", time: "O(1)", space: "O(1)" }, { op: "Delete head node", time: "O(1)", space: "O(1)" }, { op: "Reverse a Linked List", time: "O(N)", space: "O(1)" }] },
  { id: 6, title: "Introduction to Trees", icon: "fa-tree", desc: "Dive into hierarchical data, binary tree structures, and traversal methods.", theory: `<p><strong>What is a Tree?</strong> A hierarchical data structure containing nodes connected by edges.</p><p><strong>Binary Tree:</strong> A tree where each node has at most two children.</p><p><strong>Binary Search Tree (BST):</strong> A binary tree with a key ordering property.</p><p><strong>Tree Traversals:</strong></p><ul><li><strong>DFS:</strong> Preorder (Root-Left-Right), Inorder (Left-Root-Right), Postorder (Left-Right-Root).</li><li><strong>BFS:</strong> Level-by-level traversal using a queue.</li></ul>`, type: "coding", problems: [11, 12], complexity: [{ op: "Search in balanced BST", time: "O(log N)", space: "O(log N) (stack)" }, { op: "Search in skewed BST", time: "O(N)", space: "O(N) (stack)" }, { op: "Invert Binary Tree", time: "O(N)", space: "O(H)" }, { op: "Inorder traversal", time: "O(N)", space: "O(H)" }] }
];

const advancedRoadmapSteps = [
  { id: 7, title: "Advanced Arrays & Optimization", icon: "fa-bolt", desc: "Master complex array manipulations, sliding window, and two-pointer techniques.", theory: `<p><strong>Advanced Array Optimization:</strong> Optimizing array operations from O(N²) to O(N) or O(N log N).</p><p><strong>Sliding Window:</strong> Used to track contiguous subarrays.</p><p><strong>Trapping Rain Water Pattern:</strong> Two-pointer technique to solve complex optimization problems.</p>`, type: "coding", problems: [9, 5], complexity: [{ op: "Trapping Rain Water (Two Pointers)", time: "O(N)", space: "O(1)" }, { op: "LRU Cache Get / Put Operations", time: "O(1)", space: "O(Capacity)" }] },
  { id: 8, title: "Advanced Dynamic Programming", icon: "fa-layer-group", desc: "Learn advanced DP optimizations, multi-dimensional DP, and sequence matching techniques.", theory: `<p><strong>Advanced DP Concepts:</strong> Identifying states with multiple dimensions.</p><p><strong>Longest Increasing Subsequence (LIS):</strong> Can be optimized from O(N²) to O(N log N).</p><p><strong>Space Optimization:</strong> Reduce space complexity from O(N) to O(1) when state depends only on previous states.</p>`, type: "coding", problems: [7, 14], complexity: [{ op: "LIS (Naive DP)", time: "O(N²)", space: "O(N)" }, { op: "LIS (DP + Binary Search)", time: "O(N log N)", space: "O(N)" }, { op: "House Robber (Tabulation)", time: "O(N)", space: "O(N)" }, { op: "House Robber (Space Optimized)", time: "O(N)", space: "O(1)" }] },
  { id: 9, title: "Advanced Graph Algorithms", icon: "fa-circle-nodes", desc: "Solve complex graph problems using shortest path, cycle detection, topological sorting, and BFS/DFS.", theory: `<p><strong>Advanced Graphs:</strong> Complex graph traversal strategies.</p><p><strong>Topological Sort:</strong> Ordering of vertices in a DAG.</p><p><strong>Word Ladder (BFS State Space Search):</strong> BFS to find shortest path.</p><p><strong>Grid DFS/BFS (Flood Fill):</strong> Traversing matrix structures.</p>`, type: "coding", problems: [8, 13, 15], complexity: [{ op: "BFS Shortest Path (Word Ladder)", time: "O(M² * N)", space: "O(M² * N)" }, { op: "DFS Island Counting", time: "O(R * C)", space: "O(R * C)" }, { op: "Topological Sort", time: "O(V + E)", space: "O(V + E)" }] },
  { id: 10, title: "Advanced Optimization & Interview Strategies", icon: "fa-crown", desc: "Master interview-level optimization techniques, bit manipulation, and competitive programming tips.", theory: `<p><strong>Final Interview Strategies:</strong> Optimal time/space balances.</p><p><strong>Bit Manipulation:</strong> Using bitwise operations for O(1) space and fast execution.</p><p><strong>Backtracking Pruning:</strong> Cutting off recursive paths early.</p>`, type: "quiz", quiz: [{ question: "Which technique is most appropriate for finding the shortest path in an unweighted graph?", options: ["DFS", "BFS", "Dijkstra", "Kruskal"], correct: 1, explanation: "BFS explores layer by layer and is guaranteed to find the shortest path." }, { question: "What is the optimal time complexity of LIS?", options: ["O(N²)", "O(N log N)", "O(N)", "O(2^N)"], correct: 1, explanation: "LIS can be solved in O(N log N) using DP with binary search." }, { question: "How can we optimize space complexity of House Robber from O(N) to O(1)?", options: ["Using a binary search tree", "Keeping track of last two values", "Using a hash map", "Not possible"], correct: 1, explanation: "Since each state only depends on the previous two states, we only need two variables." }], complexity: [{ op: "Bitwise Operations", time: "O(1)", space: "O(1)" }, { op: "Pruned Backtracking Search", time: "O(Branch^Depth)", space: "O(Depth)" }] }
];

let roadmapTabsInitialized = false;
let roadmapStagesInitialized = false;
let currentQuizAnswers = {};
let currentRoadmapSearch = '';

/* Temporarily disabled because roadmapAdvancedTab is not present in the current HTML structure.*/
function initRoadmap() {
  if (!roadmapTabsInitialized) {
    const basicTab = document.getElementById("roadmapBasicTab");
    //const advancedTab = document.getElementById("roadmapAdvancedTab");
    const overviewTab = document.getElementById("roadmapOverviewTab");
    
    if (basicTab || advancedTab || overviewTab) {
      if (basicTab) basicTab.addEventListener("click", () => {
        [basicTab, advancedTab, overviewTab].forEach(t => t && t.classList.remove("active"));
        basicTab.classList.add("active");
        ["basicRoadmapContainer","advancedRoadmapContainer","overviewRoadmapContainer"].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.classList.remove("active");
        });
        const basic = document.getElementById("basicRoadmapContainer");
        if (basic) basic.classList.add("active");
      });

      if (advancedTab) advancedTab.addEventListener("click", () => {
        [basicTab, advancedTab, overviewTab].forEach(t => t && t.classList.remove("active"));
        advancedTab.classList.add("active");
        ["basicRoadmapContainer","advancedRoadmapContainer","overviewRoadmapContainer"].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.classList.remove("active");
        });
        const advanced = document.getElementById("advancedRoadmapContainer");
        if (advanced) advanced.classList.add("active");
      });

      if (overviewTab) overviewTab.addEventListener("click", () => {
        [basicTab, advancedTab, overviewTab].forEach(t => t && t.classList.remove("active"));
        overviewTab.classList.add("active");
        ["basicRoadmapContainer","advancedRoadmapContainer","overviewRoadmapContainer"].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.classList.remove("active");
        });
        const overview = document.getElementById("overviewRoadmapContainer");
        if (overview) overview.classList.add("active");
      });
    }
    
    // Close button for step modal
    //if (basicTab && advancedTab && overviewTab) {
    if (basicTab && overviewTab) {
      basicTab.addEventListener("click", () => { basicTab.classList.add("active"); 
        //advancedTab.classList.remove("active"); 
        overviewTab.classList.remove("active"); 
        const basicContainer = document.getElementById("basicRoadmapContainer");
        if (basicContainer) basicContainer.classList.add("active"); 
        //document.getElementById("advancedRoadmapContainer").classList.remove("active"); 
        const overviewContainer = document.getElementById("overviewRoadmapContainer");
        if (overviewContainer) overviewContainer.classList.remove("active"); });
      /*advancedTab.addEventListener("click", () => { advancedTab.classList.add("active"); basicTab.classList.remove("active"); overviewTab.classList.remove("active"); document.getElementById("advancedRoadmapContainer").classList.add("active"); document.getElementById("basicRoadmapContainer").classList.remove("active"); document.getElementById("overviewRoadmapContainer").classList.remove("active"); });*/
      overviewTab.addEventListener("click", () => { overviewTab.classList.add("active"); basicTab.classList.remove("active"); 
        //advancedTab.classList.remove("active"); 
        const overviewContainer2 = document.getElementById("overviewRoadmapContainer");
        if (overviewContainer2) overviewContainer2.classList.add("active");
        const basicContainer2 = document.getElementById("basicRoadmapContainer");
        if (basicContainer2) basicContainer2.classList.remove("active"); 
        //document.getElementById("advancedRoadmapContainer").classList.remove("active"); });
    });
    const closeBtn = document.getElementById("roadmapStepModalClose");
    const closeBtn2 = document.getElementById("roadmapStepModalCloseBtn");
    const modal = document.getElementById("roadmapStepModal");
    if (closeBtn && modal) closeBtn.addEventListener("click", () => modal.classList.remove("active"));
    if (closeBtn2 && modal) closeBtn2.addEventListener("click", () => modal.classList.remove("active"));
    if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("active"); });

    const roadmapSearchInput = document.getElementById("roadmapSearchInput");
    const clearRoadmapSearchBtn = document.getElementById("clearRoadmapSearchBtn");
    
    if (roadmapSearchInput) {
      roadmapSearchInput.addEventListener("input", (e) => {
        currentRoadmapSearch = e.target.value;
        if (currentRoadmapSearch.length > 0) clearRoadmapSearchBtn.classList.add("visible");
        else clearRoadmapSearchBtn.classList.remove("visible");
        renderBasicRoadmap();
        renderAdvancedRoadmap();
      });
    }
    
    if (clearRoadmapSearchBtn) {
      clearRoadmapSearchBtn.addEventListener("click", () => {
        if (roadmapSearchInput) roadmapSearchInput.value = "";
        currentRoadmapSearch = "";
        clearRoadmapSearchBtn.classList.remove("visible");
        renderBasicRoadmap();
        renderAdvancedRoadmap();
        if (roadmapSearchInput) roadmapSearchInput.focus();
      });
    }

    roadmapTabsInitialized = true;
  }
  renderBasicRoadmap();
  //renderAdvancedRoadmap();
  const progressBar = document.getElementById("roadmapProgress");
  const stages = document.querySelectorAll(".stage");
  if (!roadmapStagesInitialized) {
    stages.forEach((stage) => {
      stage.style.cursor = "pointer";

      stage.addEventListener("click", () => {
        const level = stage.dataset.level;

        if (level === "beginner") {
          document.getElementById("roadmapBasicTab")?.click();
        } else if (level === "intermediate") {
          document.getElementById("roadmapOverviewTab")?.click();
        } else if (level === "advanced") {
          document
            .querySelector(".roadmap-container")
            ?.scrollIntoView({ behavior: "smooth" });
        }
      });
    });

    roadmapStagesInitialized = true;
  }
  if (progressBar && stages.length >= 3) {
    const progress = Math.min((userProgress.completedProblems.length / practiceProblems.length) * 100, 100);
    setTimeout(() => {
      progressBar.style.width = `${progress}%`;
      if (progress >= 25) stages[0].classList.add("active");
      if (progress >= 70) stages[1].classList.add("active");
      if (progress === 100) stages[2].classList.add("active");
    }, 500);
  }
}
}

function isRoadmapStepCompleted(step) {
  if (step.type === "quiz") return userProgress.completedRoadmapSteps.includes(step.id);
  return step.problems.some(pid => userProgress.completedProblems.includes(pid));
}

function renderBasicRoadmap() {
  const timeline = document.getElementById("basicRoadmapTimeline");
  if (!timeline) return;

  const searchLower = currentRoadmapSearch.toLowerCase().trim();
  const filteredSteps = roadmapSteps.filter(step => {
    return step.title.toLowerCase().includes(searchLower) || 
           step.desc.toLowerCase().includes(searchLower) ||
           step.theory.toLowerCase().includes(searchLower);
  });

  if (filteredSteps.length === 0) {
    timeline.innerHTML = `<div class="empty-state" style="text-align:center; padding:3rem; color:var(--text-secondary);"><p>No roadmap steps found matching "${currentRoadmapSearch}".</p></div>`;
    return;
  }

  let html = "";
  filteredSteps.forEach((step) => {
    const index = roadmapSteps.indexOf(step);
    const isCompleted = isRoadmapStepCompleted(step);
    let isUnlocked = index === 0 || isRoadmapStepCompleted(roadmapSteps[index - 1]);
    let statusClass = "locked", statusText = "Locked", statusTagClass = "locked-tag";
    if (isCompleted) { statusClass = "completed"; statusText = "Completed"; statusTagClass = "completed-tag"; }
    else if (isUnlocked) { statusClass = "active"; statusText = "Active"; statusTagClass = "active-tag"; }
    let progressPercent = 0, progressText = "";
    if (step.type === "quiz") { progressPercent = isCompleted ? 100 : 0; progressText = isCompleted ? "Passed" : "Not Started"; }
    else { const solved = step.problems.filter(pid => userProgress.completedProblems.includes(pid)).length; progressPercent = Math.round((solved / step.problems.length) * 100); progressText = `${solved}/${step.problems.length} Solved`; }
    let stepIcon = `<i class="fa-solid ${step.icon}"></i>`;
    if (isCompleted) stepIcon = `<i class="fa-solid fa-check"></i>`;
    else if (statusClass === "locked") stepIcon = `<i class="fa-solid fa-lock"></i>`;
    html += `<div class="roadmap-step ${statusClass}" data-step="${step.id}"><div class="step-marker-dot">${stepIcon}</div><div class="roadmap-step-card"><div class="step-card-header"><span class="step-number">Step ${step.id}</span><span class="step-status-tag ${statusTagClass}">${statusText}</span></div><h3 class="step-title">${step.title}</h3><p class="step-desc">${step.desc}</p><div class="step-card-footer"><div class="step-progress"><div class="step-progress-label">Progress: ${progressText} (${progressPercent}%)</div><div class="step-progress-bar-container"><div class="step-progress-bar-fill" style="width: ${progressPercent}%;"></div></div></div>${isUnlocked ? `<button class="btn btn-primary btn-sm" onclick="openRoadmapStepModal(${index}, 'basic')">${isCompleted ? 'Review Step' : 'Start Step'}</button>` : `<button class="btn btn-secondary btn-sm" disabled><i class="fa-solid fa-lock"></i> Locked</button>`}</div></div></div>`;
  });
  timeline.innerHTML = html;
}

function renderAdvancedRoadmap() {
  const timeline = document.getElementById("advancedRoadmapTimeline");
  if (!timeline) return;

  const searchLower = currentRoadmapSearch.toLowerCase().trim();
  const filteredSteps = advancedRoadmapSteps.filter(step => {
    return step.title.toLowerCase().includes(searchLower) || 
           step.desc.toLowerCase().includes(searchLower) ||
           step.theory.toLowerCase().includes(searchLower);
  });

  if (filteredSteps.length === 0) {
    timeline.innerHTML = `<div class="empty-state" style="text-align:center; padding:3rem; color:var(--text-secondary);"><p>No roadmap steps found matching "${currentRoadmapSearch}".</p></div>`;
    return;
  }

  let html = "";
  filteredSteps.forEach((step) => {
    const index = advancedRoadmapSteps.indexOf(step);
    const isCompleted = isRoadmapStepCompleted(step);
    let isUnlocked = index === 0 || isRoadmapStepCompleted(advancedRoadmapSteps[index - 1]);
    let statusClass = "locked", statusText = "Locked", statusTagClass = "locked-tag";
    if (isCompleted) { statusClass = "completed"; statusText = "Completed"; statusTagClass = "completed-tag"; }
    else if (isUnlocked) { statusClass = "active"; statusText = "Active"; statusTagClass = "active-tag"; }
    let progressPercent = 0, progressText = "";
    if (step.type === "quiz") { progressPercent = isCompleted ? 100 : 0; progressText = isCompleted ? "Passed" : "Not Started"; }
    else { const solved = step.problems.filter(pid => userProgress.completedProblems.includes(pid)).length; progressPercent = Math.round((solved / step.problems.length) * 100); progressText = `${solved}/${step.problems.length} Solved`; }
    let stepIcon = `<i class="fa-solid ${step.icon}"></i>`;
    if (isCompleted) stepIcon = `<i class="fa-solid fa-check"></i>`;
    else if (statusClass === "locked") stepIcon = `<i class="fa-solid fa-lock"></i>`;
    html += `<div class="roadmap-step ${statusClass}" data-step="${step.id}"><div class="step-marker-dot">${stepIcon}</div><div class="roadmap-step-card"><div class="step-card-header"><span class="step-number">Step ${step.id}</span><span class="step-status-tag ${statusTagClass}">${statusText}</span></div><h3 class="step-title">${step.title}</h3><p class="step-desc">${step.desc}</p><div class="step-card-footer"><div class="step-progress"><div class="step-progress-label">Progress: ${progressText} (${progressPercent}%)</div><div class="step-progress-bar-container"><div class="step-progress-bar-fill" style="width: ${progressPercent}%;"></div></div></div>${isUnlocked ? `<button class="btn btn-primary btn-sm" onclick="openRoadmapStepModal(${index}, 'advanced')">${isCompleted ? 'Review Step' : 'Start Step'}</button>` : `<button class="btn btn-secondary btn-sm" disabled><i class="fa-solid fa-lock"></i> Locked</button>`}</div></div></div>`;
  });
  timeline.innerHTML = html;
}

function openRoadmapStepModal(stepIndex, type = 'basic') {
  const steps = type === 'basic' ? roadmapSteps : advancedRoadmapSteps;
  const step = steps[stepIndex];
  if (!step) return;
  const modal = document.getElementById("roadmapStepModal");
  if (!modal) return;
  currentQuizAnswers = {};
  const badgeEl = document.getElementById("roadmapStepBadge");
  if (badgeEl) badgeEl.textContent = `Step ${step.id}`;
  const titleEl = document.getElementById("roadmapStepModalTitle");
  if (titleEl) titleEl.textContent = step.title;
  const theoryEl = document.getElementById("roadmapStepTheoryContent");
  if (theoryEl) theoryEl.innerHTML = step.theory;
  const complexitySection = document.getElementById("roadmapStepComplexitySection");
  if (step.complexity && step.complexity.length > 0 && complexitySection) {
    complexitySection.classList.remove("hidden");
    const body = document.getElementById("roadmapStepComplexityBody");
    if (body) body.innerHTML = step.complexity.map(item => `<tr><td>${item.op}</td><td>${item.time}</td><td>${item.space}</td></tr>`).join("");
  } else if (complexitySection) complexitySection.classList.add("hidden");
  const quizSection = document.getElementById("roadmapStepQuizSection");
  const problemsSection = document.getElementById("roadmapStepProblemsSection");
  if (step.type === "quiz" && quizSection && problemsSection) {
    quizSection.classList.remove("hidden");
    problemsSection.classList.add("hidden");
    const quizContent = document.getElementById("roadmapStepQuizContent");
    const isCompleted = userProgress.completedRoadmapSteps.includes(step.id);
    if (quizContent) quizContent.innerHTML = step.quiz.map((q, qIndex) => `<div class="quiz-question-container" data-qindex="${qIndex}"><div class="quiz-question-text">${qIndex + 1}. ${q.question}</div><ul class="quiz-options-list">${q.options.map((opt, oIndex) => `<li class="quiz-option-item" ${isCompleted && oIndex === q.correct ? 'class="quiz-option-item correct"' : ''} ${isCompleted ? 'style="pointer-events:none; cursor:default;"' : ''} data-oindex="${oIndex}" onclick="${isCompleted ? '' : `selectQuizOption(${step.id}, ${qIndex}, ${oIndex}, this)`}">${opt}</li>`).join("")}</ul><div class="quiz-feedback ${isCompleted ? 'correct' : 'hidden'}">${isCompleted ? `Correct! ${q.explanation}` : ''}</div></div>`).join("");
    const submitBtn = document.getElementById("roadmapStepSubmitQuizBtn");
    if (submitBtn) {
      if (isCompleted) submitBtn.style.display = "none";
      else { submitBtn.style.display = "block"; submitBtn.onclick = () => submitRoadmapQuiz(stepIndex, type); }
    }
  } else if (quizSection && problemsSection) {
    quizSection.classList.add("hidden");
    problemsSection.classList.remove("hidden");
    const problemsList = document.getElementById("roadmapStepProblemsList");
    problemsList.innerHTML = step.problems.map(pid => {
      const prob = practiceProblems.find(p => p.id === pid);
      if (!prob) return "";
      const isSolved = userProgress.completedProblems.includes(pid);
      return `<li class="roadmap-problem-item"><div class="roadmap-problem-info"><span class="roadmap-problem-title">${prob.title}</span><div class="roadmap-problem-meta"><span class="difficulty-badge ${getDifficultyClass(prob.difficulty)}">${prob.difficulty}</span><span>Acceptance: ${prob.acceptance}</span></div></div><div class="roadmap-problem-action">${isSolved ? `<span class="roadmap-problem-status completed"><i class="fas fa-check-circle"></i> Solved</span>` : `<button class="btn btn-outline btn-sm" onclick="openCodingProblem(${pid})"><i class="fas fa-play"></i> Solve</button>`}</div></li>`;
    }).join("");
  }
  modal.classList.add("active");
}

function selectQuizOption(stepId, qIndex, oIndex, element) {
  const container = element.closest(".quiz-question-container");
  container.querySelectorAll(".quiz-option-item").forEach(el => el.classList.remove("selected"));
  element.classList.add("selected");
  currentQuizAnswers[qIndex] = oIndex;
}

function openCodingProblem(problemId) {
  const modal = document.getElementById("roadmapStepModal");
  if (modal) modal.classList.remove("active");
  handleProblemClick(problemId);
}

function submitRoadmapQuiz(stepIndex, type = 'basic') {
  const steps = type === 'basic' ? roadmapSteps : advancedRoadmapSteps;
  const step = steps[stepIndex];
  const container = document.getElementById("roadmapStepQuizContent");
  let allCorrect = true, allAnswered = true;
  step.quiz.forEach((q, qIndex) => { if (currentQuizAnswers[qIndex] === undefined) allAnswered = false; });
  if (!allAnswered) { showNotification("Please answer all questions before submitting!", "error"); return; }
  step.quiz.forEach((q, qIndex) => {
    const qContainer = container.querySelector(`[data-qindex="${qIndex}"]`);
    const feedbackEl = qContainer.querySelector(".quiz-feedback");
    const selected = currentQuizAnswers[qIndex];
    qContainer.querySelectorAll(".quiz-option-item").forEach((optEl, oIndex) => {
      optEl.classList.remove("selected", "correct", "incorrect");
      optEl.style.pointerEvents = "none";
      optEl.style.cursor = "default";
      if (oIndex === q.correct) optEl.classList.add("correct");
      else if (oIndex === selected) optEl.classList.add("incorrect");
    });
    feedbackEl.classList.remove("hidden", "correct", "incorrect");
    if (selected === q.correct) { feedbackEl.textContent = `Correct! ${q.explanation}`; feedbackEl.className = "quiz-feedback correct"; }
    else { allCorrect = false; feedbackEl.textContent = `Incorrect. ${q.explanation}`; feedbackEl.className = "quiz-feedback incorrect"; }
  });
  if (allCorrect) {
    if (!userProgress.completedRoadmapSteps.includes(step.id)) { userProgress.completedRoadmapSteps.push(step.id); addXP(50); saveUserData(); showNotification(`🎉 Quiz Passed! Step ${step.id} Completed. +50 XP!`, "success"); updateDashboard(); updateGamification(); initRoadmap(); }
    const submitBtn = document.getElementById("roadmapStepSubmitQuizBtn");
    if (submitBtn) submitBtn.style.display = "none";
  } else {
    showNotification("Some answers were incorrect. Please review and try again!", "error");
    setTimeout(() => {
      step.quiz.forEach((q, qIndex) => {
        const qContainer = container.querySelector(`[data-qindex="${qIndex}"]`);
        const feedbackEl = qContainer.querySelector(".quiz-feedback");
        if (currentQuizAnswers[qIndex] !== q.correct) {
          qContainer.querySelectorAll(".quiz-option-item").forEach(optEl => { optEl.style.pointerEvents = "auto"; optEl.style.cursor = "pointer"; optEl.classList.remove("correct", "incorrect"); if (optEl.classList.contains("selected")) optEl.classList.remove("selected"); });
          feedbackEl.classList.add("hidden");
          delete currentQuizAnswers[qIndex];
        }
      });
    }, 3000);
  }
}

// ============================================
// DASHBOARD
// ============================================
function initDashboard() { updateDashboard(); updateProfile(); }

function updateDashboard() {
  const completedProblemsEl = document.getElementById("completedProblems");
  if (completedProblemsEl) completedProblemsEl.textContent = userProgress.completedProblems.length;
  const currentStreakEl = document.getElementById("currentStreak");
  if (currentStreakEl) currentStreakEl.textContent = userProgress.streak;
  const currentFreezes = document.getElementById("currentFreezes");
  if (currentFreezes) currentFreezes.textContent = userProgress.freezes || 0;
  const totalXPEl = document.getElementById("totalXP");
  if (totalXPEl) totalXPEl.textContent = userProgress.xp;
  updateCurrentDate();
  updateActivityList();
  renderActivityHeatmap();
  if (typeof updateFreezeHistoryList === "function") updateFreezeHistoryList();
  updateBadges();
  updateRecentProblems();
  updateLeaderboard();
  const grid = document.querySelector(".dashboard-grid");
  if (grid && !document.getElementById("personalityCard")) { const pCard = document.createElement("div"); pCard.className = "dashboard-card personality-card"; pCard.id = "personalityCard"; const profileCard = grid.querySelector(".profile-card"); if (profileCard) profileCard.after(pCard); else grid.prepend(pCard); }
  renderPersonalityCard();
  if (grid && !document.getElementById("mistakeDnaCard")) { const mCard = document.createElement("div"); mCard.className = "dashboard-card mistake-dna-card"; mCard.id = "mistakeDnaCard"; const personalityCard = document.getElementById("personalityCard"); if (personalityCard) personalityCard.after(mCard); else { const profileCard = grid.querySelector(".profile-card"); if (profileCard) profileCard.after(mCard); else grid.prepend(mCard); } }
  renderMistakeDnaCard();
}

function updateCurrentDate() {
  const dateEl = document.getElementById("dashboard-current-date");
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function updateActivityList() {
  const activityList = document.getElementById("activityList");
  if (!activityList) return;
  if (userProgress.completedProblems.length === 0) { activityList.innerHTML = '<p class="empty-state">No recent activity. Start solving problems!</p>'; return; }
  const activities = userProgress.completedProblems.slice(-5).map(pid => { const problem = practiceProblems.find(p => p.id === pid); return { problem: problem ? problem.title : "Unknown", time: "Today" }; });
  activityList.innerHTML = activities.map(activity => `<div class="activity-item"><div class="activity-type"><span class="activity-icon"><i class="fas fa-code"></i></span><span>Solved: ${activity.problem}</span></div><span class="activity-time">${activity.time}</span></div>`).join("");
}

function updateRecentProblems() {
  const container = document.getElementById("recentProblemsList");
  if (!container) return;
  if (!userProgress.recentProblems || userProgress.recentProblems.length === 0) { container.innerHTML = "<p>No recently viewed problems</p>"; return; }
  container.innerHTML = userProgress.recentProblems.map(id => { const problem = practiceProblems.find(p => p.id === id); return problem ? `<div class="recent-problem" data-id="${problem.id}">${problem.title}</div>` : ""; }).join("");
  container.querySelectorAll(".recent-problem").forEach(item => { item.addEventListener("click", () => { const problemId = parseInt(item.dataset.id); const problem = practiceProblems.find(p => p.id === problemId); if (problem) openQuizEditor(problem); }); });
}

function updateFreezeHistoryList() {
  const freezeHistoryList = document.getElementById("freezeHistoryList");
  if (!freezeHistoryList) return;
  const history = userProgress.freezeHistory || [];
  if (history.length === 0) { freezeHistoryList.innerHTML = '<p class="empty-state">No freezes used yet.</p>'; return; }
  freezeHistoryList.innerHTML = history.slice(-5).reverse().map(h => `<div class="activity-item"><div class="activity-type"><span class="activity-icon"><i class="fas fa-snowflake" style="color:#00d2ff;"></i></span><span>${h.reason}</span></div><span class="activity-time">${new Date(h.date).toLocaleDateString()}</span></div>`).join("");
}

function updateBadges() {
  const container = document.getElementById("badgesContainer");
  const grid = document.getElementById("badgesGrid");
  const badges = [{ id: 1, icon: "🌟", name: "First Steps", description: "Begin your journey", criteria: "Solve 1 problem", earned: userProgress.completedProblems.length >= 1 }, { id: 2, icon: "🔥", name: "On Fire", description: "Keep the momentum going", criteria: "Maintain a 7-day streak", earned: userProgress.streak >= 7 }, { id: 3, icon: "💎", name: "Diamond", description: "Reach a major XP milestone", criteria: "Earn 5,000 XP", earned: userProgress.xp >= 5000 }, { id: 4, icon: "🚀", name: "Rocket", description: "Speed through problems", criteria: "Solve 50 problems", earned: userProgress.completedProblems.length >= 50 }, { id: 5, icon: "👑", name: "Master", description: "Achieve expert problem-solving", criteria: "Solve 100 problems", earned: userProgress.completedProblems.length >= 100 }, { id: 6, icon: "🎯", name: "Sharpshooter", description: "Hit the target with consistency", criteria: "Solve 25 problems and earn 2,500 XP", earned: userProgress.completedProblems.length >= 25 && userProgress.xp >= 2500 }];
  const earned = badges.filter(b => b.earned).map(b => b.id);
  if (JSON.stringify(earned) !== JSON.stringify(userProgress.badges)) { userProgress.badges = earned; saveUserData(); }
  if (container) container.innerHTML = badges.map(badge => `<div class="badge ${badge.earned ? '' : 'locked'}" tabindex="0"><span class="badge-tooltip"><strong>${badge.name}</strong><span>${badge.description}</span><span>${badge.criteria}</span></span>${badge.icon}</div>`).join("");
  if (grid) grid.innerHTML = badges.map(badge => `<div class="badge-lg ${badge.earned ? '' : 'locked'}" tabindex="0"><span class="badge-tooltip"><strong>${badge.name}</strong><span>${badge.description}</span><span>${badge.criteria}</span></span>${badge.icon}</div>`).join("");
}

// ============================================
// LEADERBOARD
// ============================================
let leaderboardRequestId = 0;
const LEADERBOARD_LIMIT = 10;

function updateLeaderboard() {
  const leaderboardList = document.getElementById("leaderboardList");
  if (!leaderboardList) return;
  const requestId = ++leaderboardRequestId;
  renderLeaderboardRows(buildLeaderboardRows([], getCurrentUserId()), getCurrentUserId(), { emptyMessage: "Loading leaderboard..." });
  loadLeaderboard().then(({ leaders, currentUserId }) => {
    if (requestId !== leaderboardRequestId) return;
    const resolvedCurrentUserId = currentUserId || getCurrentUserId();
    renderLeaderboardRows(buildLeaderboardRows(leaders, resolvedCurrentUserId), resolvedCurrentUserId);
  }).catch(error => {
    if (error.name === 'AbortError') return;
    console.warn("Could not load leaderboard:", error);
    if (requestId !== leaderboardRequestId) return;
    renderLeaderboardRows(buildLeaderboardRows([], getCurrentUserId()), getCurrentUserId(), { emptyMessage: "Leaderboard unavailable." });
  });
}

async function loadLeaderboard() {
  if (location.protocol === "file:") return { leaders: [], currentUserId: null };
  const signal = apiAbort.getSignal('leaderboard');
  try {
    // Cache leaderboard data for 5 minutes (300000 ms) with stale-while-revalidate
    return await apiCache.fetchWithCache("/api/leaderboard", { credentials: "include", signal }, 300000, 'json');
  } finally {
    apiAbort.clearSignal('leaderboard');
  }
}

function buildLeaderboardRows(leaders = [], currentUserId = getCurrentUserId()) {
  const rowsById = new Map();
  leaders.forEach(leader => { const normalized = normalizeLeaderboardEntry(leader); if (normalized.id) rowsById.set(normalized.id, normalized); });
  const currentEntry = getCurrentLeaderboardEntry(currentUserId);
  if (currentUserId !== "local-user" || userProgress.xp > 350 || leaders.length === 0) rowsById.set(currentEntry.id, currentEntry);
  const rankedRows = Array.from(rowsById.values()).sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name)).map((leader, index) => ({ ...leader, rank: index + 1 }));
  const visibleRows = rankedRows.slice(0, LEADERBOARD_LIMIT);
  if (!visibleRows.some(leader => leader.id === currentEntry.id)) { const currentRow = rankedRows.find(leader => leader.id === currentEntry.id); if (currentRow) visibleRows[visibleRows.length - 1] = currentRow; }
  return visibleRows;
}

function normalizeLeaderboardEntry(entry) { return { id: String(entry.id || ""), name: String(entry.name || "Learner"), xp: Math.max(0, Number(entry.xp) || 0), level: Math.max(1, Number(entry.level) || 1), avatar: String(entry.avatar || "🚀"), rank: Number(entry.rank) || null }; }

function getCurrentLeaderboardEntry(currentUserId = getCurrentUserId()) { return normalizeLeaderboardEntry({ id: currentUserId || "local-user", name: getCurrentDisplayName(), xp: userProgress.xp, level: userProgress.level, avatar: userProgress.avatar }); }

function getCurrentUserId() { return window.algoAuth?.user?.sub || window.algoAuth?.user?.id || cachedSession?.user?.sub || "local-user"; }

function getCurrentDisplayName() { return window.algoAuth?.user?.name || cachedSession?.user?.name || userProgress.name || "Learner"; }

function renderLeaderboardRows(rows, currentUserId = getCurrentUserId(), options = {}) {
  const leaderboardList = document.getElementById("leaderboardList");
  if (!leaderboardList) return;
  if (!rows.length) { leaderboardList.innerHTML = `<p class="empty-state">${options.emptyMessage || "No leaderboard data yet."}</p>`; return; }
  leaderboardList.innerHTML = rows.map(user => { const isCurrentUser = user.id === currentUserId || (currentUserId === "local-user" && user.id === "local-user"); const displayName = isCurrentUser ? `${user.name} (You)` : user.name; return `<div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''}"><span class="leader-rank">#${user.rank}</span><span class="leader-avatar" aria-hidden="true">${escapeHtml(user.avatar)}</span><span class="leader-name">${escapeHtml(displayName)}</span><span class="leader-xp">${user.xp.toLocaleString()} XP</span></div>`; }).join("");
}

// ============================================
// GAMIFICATION
// ============================================
function initGamification() { updateXPBar(); }

function initDailyChallenge() {
  const card = document.getElementById("dailyChallengeCard");
  const textEl = document.getElementById("dailyChallengeText");
  const btn = document.getElementById("completeChallengeBtn");
  if (!card || !textEl || !btn) return;
  const challenge = dailyChallenges[getDayOfYear() % dailyChallenges.length];
  const completedChallenges = userProgress.completedDailyChallenges || [];
  const alreadyCompleted = completedChallenges.includes(challenge.id);
  textEl.textContent = `${challenge.title}: ${challenge.description}`;
  btn.disabled = alreadyCompleted;
  btn.innerHTML = alreadyCompleted ? "Challenge Completed ✓" : `<i class="fas fa-bolt"></i> Complete Challenge (+${challenge.xpReward} XP)`;
  btn.addEventListener("click", () => {
    if (!userProgress.completedDailyChallenges) userProgress.completedDailyChallenges = [];
    if (!userProgress.completedDailyChallenges.includes(challenge.id)) { userProgress.completedDailyChallenges.push(challenge.id); addXP(challenge.xpReward); saveUserData(); showNotification(`Challenge completed! +${challenge.xpReward} XP earned! 🚀`, "success"); btn.disabled = true; btn.textContent = "Challenge Completed ✓"; }
  });
}

function addXP(amount, source = "general", meta = {}) { userProgress.xp += amount; recordAnalyticsEvent("xp", { amount, source, ...meta }); checkLevelUp(); saveUserData(); }

function checkLevelUp() {
  const levels = [0, 1000, 2500, 5000, 10000, 20000, 50000, 100000];
  const levelNames = ["Beginner", "Novice", "Intermediate", "Advanced", "Expert", "Master", "Grandmaster", "Legend"];
  let newLevel = 1;
  for (let i = levels.length - 1; i >= 0; i--) { if (userProgress.xp >= levels[i]) { newLevel = i + 1; break; } }
  if (newLevel > userProgress.level) showNotification(`🎉 Level Up! You're now Level ${newLevel} - ${levelNames[newLevel - 1]}`, "success");
  userProgress.level = newLevel;
  const levelBadge = document.getElementById("levelBadge");
  if (levelBadge) levelBadge.textContent = `Level ${newLevel} - ${levelNames[newLevel - 1]}`;
}

function updateGamification() { updateXPBar(); updateBadges(); }

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.style.cssText = `position:fixed; top:100px; right:20px; padding:1rem 1.5rem; background:${type === "success" ? "var(--gradient-4)" : type === "error" ? "#ef4444" : "var(--primary)"}; color:${type === "success" ? "var(--dark-bg)" : "white"}; border-radius:10px; box-shadow:var(--glass-shadow); z-index:10000; animation:slideIn 0.3s ease; font-weight:600; max-width:350px;`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => { notification.style.opacity = "0"; notification.style.transform = "translateX(100%)"; notification.style.transition = "all 0.3s ease"; setTimeout(() => notification.remove(), 300); }, 3000);
}

function updateXPBar() {
  const levels = [0, 1000, 2500, 5000, 10000, 20000, 50000, 100000];
  const currentLevel = userProgress.level;
  const currentLevelXP = levels[currentLevel - 1] || 0;
  const nextLevelXP = levels[currentLevel] || 100000;
  const xpProgress = ((userProgress.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  setTimeout(() => { 
    const xpBar = document.getElementById("xpBar");
    const xpText = document.getElementById("xpText");
    if (xpBar) xpBar.style.width = `${Math.min(xpProgress, 100)}%`; 
    if (xpText) xpText.textContent = `${userProgress.xp} / ${nextLevelXP} XP`; 
  }, 300);
}

// ============================================
// CHATBOT
// ============================================
function initChatbot() {
  const toggle = document.getElementById("chatbotToggle");
  const windowEl = document.getElementById("chatbotWindow");
  const close = document.getElementById("chatbotClose");
  const input = document.getElementById("chatbotInput");
  const send = document.getElementById("chatbotSend");
  const quickQs = document.querySelectorAll(".quick-q");
  if (!toggle || !windowEl || !close || !input || !send) return;

  const header = windowEl.querySelector(".chatbot-header");
  if (header && !document.getElementById("doubtGenToggle")) {
    if (!document.getElementById("doubt-gen-styles")) {
      const styleEl = document.createElement("style");
      styleEl.id = "doubt-gen-styles";
      styleEl.textContent = `.doubt-gen-toggle-container{display:flex;align-items:center;gap:6px;margin-left:auto;margin-right:12px;font-size:0.75rem;color:rgba(255,255,255,0.7);user-select:none;background:rgba(255,255,255,0.05);padding:4px 8px;border-radius:20px;border:1px solid rgba(255,255,255,0.1);}.doubt-gen-toggle-container span{font-weight:600;letter-spacing:0.5px;}.doubt-gen-switch{position:relative;display:inline-block;width:32px;height:18px;}.doubt-gen-switch input{opacity:0;width:0;height:0;}.doubt-gen-slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background-color:rgba(255,255,255,0.15);transition:.3s ease;border-radius:34px;}.doubt-gen-slider:before{position:absolute;content:"";height:12px;width:12px;left:3px;bottom:3px;background-color:#fff;transition:.3s ease;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.4);}.doubt-gen-switch input:checked+.doubt-gen-slider{background-color:var(--primary,#8b5cf6);box-shadow:0 0 8px rgba(139,92,246,0.5);}.doubt-gen-switch input:checked+.doubt-gen-slider:before{transform:translateX(14px);}`;
      document.head.appendChild(styleEl);
    }
    const toggleContainer = document.createElement("div");
    toggleContainer.className = "doubt-gen-toggle-container";
    toggleContainer.innerHTML = `<span>Doubt Gen</span><label class="doubt-gen-switch"><input type="checkbox" id="doubtGenToggle"><span class="doubt-gen-slider"></span></label>`;
    header.insertBefore(toggleContainer, close);
    const toggleInput = document.getElementById("doubtGenToggle");
    const headerTitle = header.querySelector("h4");
    if (toggleInput && headerTitle) {
      toggleInput.addEventListener("change", () => {
        if (toggleInput.checked) { headerTitle.textContent = "Doubt Generator"; showNotification("Self-Debugging Mode Activated!", "success"); addChatMessage(`<div style="font-size:0.85rem;color:#a7f3d0;background:rgba(16,185,129,0.1);border:1px dashed #10b981;padding:8px 12px;border-radius:8px;margin-bottom:5px;">🔍 <strong>Doubt Generator Enabled</strong><br>I will ask Socratic questions to help you spot bugs!</div>`, "bot", { html: true }); }
        else { headerTitle.textContent = "Algo Assistant"; showNotification("Standard Mode Activated.", "info"); addChatMessage(`<div style="font-size:0.85rem;color:#c084fc;background:rgba(139,92,246,0.1);border:1px dashed #a855f7;padding:8px 12px;border-radius:8px;margin-bottom:5px;">💡 <strong>Standard Assistant Enabled</strong><br>I will provide direct code templates and explanations!</div>`, "bot", { html: true }); }
      });
    }
  }

  toggle.addEventListener("click", () => { windowEl.classList.toggle("hidden"); const badge = toggle.querySelector(".chatbot-badge"); if (badge) badge.style.display = "none"; });
  close.addEventListener("click", () => windowEl.classList.add("hidden"));

  function sendMessage() {
    const message = input.value.trim();
    if (!message) return;
    addChatMessage(message, "user");
    input.value = "";
    const loadingEl = document.createElement("div");
    loadingEl.className = "message bot loading";
    loadingEl.innerHTML = `<p>⏳ Algo Assistant is typing...</p>`;
    const messagesContainer = document.getElementById("chatbotMessages");
    messagesContainer.appendChild(loadingEl);
    messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior: "smooth" });
    setTimeout(() => { loadingEl.remove(); const response = getBotResponse(message); addChatMessage(response, "bot", { html: true }); }, 1000);
  }

  send.addEventListener("click", sendMessage);
  input.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });
  quickQs.forEach(btn => btn.addEventListener("click", () => { input.value = btn.getAttribute("data-question"); sendMessage(); }));
}

function addChatMessage(message, sender, { html = false } = {}) {
  const messagesContainer = document.getElementById("chatbotMessages");
  const messageEl = document.createElement("div");
  messageEl.className = `message ${sender}`;

  if (html) {
    // Never trust user-influenced HTML. Sanitize before injecting.
    if (typeof window !== 'undefined' && window.DOMSanitizer?.sanitizeHTML) {
      messageEl.innerHTML = window.DOMSanitizer.sanitizeHTML(message);
    } else {
      messageEl.textContent = String(message ?? '');
    }
  } else {
    messageEl.textContent = message;
  }

  messagesContainer.appendChild(messageEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}


function getBotResponse(question) {
  const q = question.toLowerCase();
  const doubtGenToggle = document.getElementById("doubtGenToggle");
  const isDoubtGenActive = doubtGenToggle && doubtGenToggle.checked;

  if (isDoubtGenActive) {
    let category = "General", doubtQuestion = "", debuggingTip = "";
    const isCode = q.includes("{") || q.includes("}") || q.includes("function") || q.includes("def ") || q.includes("for(") || q.includes("while(");
    if (isCode) { category = "Code Analysis"; doubtQuestion = "Look closely at your loop/recursion variables. Are they guaranteed to change in every iteration?"; debuggingTip = "Trace the value of your loop counters for the first 3 iterations."; }
    else if (q.includes("sort")) { category = "Sorting Algorithms"; doubtQuestion = "What happens to equal elements during comparisons?"; debuggingTip = "Dry-run with a small duplicate array."; }
    else if (q.includes("recursion")) { category = "Recursion"; doubtQuestion = "Is your recursion guaranteed to reach the base case?"; debuggingTip = "Add console logs at the top to print input values."; }
    else if (q.includes("dp") || q.includes("dynamic")) { category = "Dynamic Programming"; doubtQuestion = "Are the base cases of your DP table correctly initialized?"; debuggingTip = "Draw a small DP table and fill first 3 cells manually."; }
    else if (q.includes("tree") || q.includes("graph")) { category = "Trees & Graphs"; doubtQuestion = "Does your traversal check for cycles or visited nodes?"; debuggingTip = "Verify 'visited' set initialization."; }
    else if (q.includes("array") || q.includes("list") || q.includes("index")) { category = "Arrays & Memory Bounds"; doubtQuestion = "What happens if the input is empty or has only one element?"; debuggingTip = "Check index calculation on last iteration."; }
    else { category = "General Self-Debugging"; doubtQuestion = "What are the exact inputs and outputs you expect?"; debuggingTip = "Try explaining your algorithm line-by-line."; }
    return `<div class="assistant-response doubt-gen-response"><h4 style="color:var(--accent,#a78bfa);"><i class="fas fa-question-circle"></i> Doubt Generator Mode</h4><div style="margin-top:8px;"><strong>Category:</strong> <span style="background:rgba(139,92,246,0.2);padding:2px 6px;border-radius:4px;font-size:0.8rem;color:#c084fc;">${category}</span></div><div style="margin-top:12px;border-left:3px solid var(--primary,#8b5cf6);padding-left:10px;"><h5 style="margin:0 0 4px 0;font-size:0.9rem;color:var(--accent,#a78bfa);">🔍 Socratic Question:</h5><p style="font-style:italic;color:#f1f5f9;margin:0;line-height:1.4;">"${doubtQuestion}"</p></div><div style="margin-top:14px;background:rgba(255,255,255,0.02);padding:8px 12px;border-radius:6px;"><h5 style="margin:0 0 4px 0;font-size:0.9rem;color:#10b981;">🛠️ Debugging Tip:</h5><p style="margin:0;font-size:0.85rem;line-height:1.4;color:#cbd5e1;">${debuggingTip}</p></div><div style="margin-top:14px;font-size:0.75rem;color:#94a3b8;border-top:1px solid rgba(255,255,255,0.05);padding-top:8px;"><i class="fas fa-info-circle"></i> <em>Answer the question to locate the bug. Turn off "Doubt Gen" for direct solutions.</em></div></div>`;
  }

  let response = chatbotResponses["default"];
  for (const key in chatbotResponses) { if (q.includes(key)) { response = chatbotResponses[key]; break; } }
  const cpType = userProgress.codingPersonality?.type || "brute-force first";
  let personalityHint = "";
  if (cpType === "brute-force first") personalityHint = `<div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-left:3px solid #ef4444;padding:8px 12px;border-radius:6px;margin-top:15px;font-size:0.8rem;line-height:1.4;color:#f87171;">⚠️ <strong>Tip (Brute-Force First)</strong>: Remember edge checks before typing logic!</div>`;
  else if (cpType === "over-optimizer") personalityHint = `<div style="background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.2);border-left:3px solid #a855f7;padding:8px 12px;border-radius:6px;margin-top:15px;font-size:0.8rem;line-height:1.4;color:#c084fc;">⚡ <strong>Tip (Over-Optimizer)</strong>: Focus on clean code readability!</div>`;
  else if (cpType === "slow but accurate") personalityHint = `<div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);border-left:3px solid #3b82f6;padding:8px 12px;border-radius:6px;margin-top:15px;font-size:0.8rem;line-height:1.4;color:#60a5fa;">⏱️ <strong>Tip (Slow but Accurate)</strong>: Try setting a timer for 15 minutes!</div>`;
  else if (cpType === "greedy thinker") personalityHint = `<div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-left:3px solid #10b981;padding:8px 12px;border-radius:6px;margin-top:15px;font-size:0.8rem;line-height:1.4;color:#34d399;">🎯 <strong>Tip (Greedy Thinker)</strong>: Ensure greedy choice guarantees global optimum!</div>`;
  return `<div class="assistant-response"><h4>🧠 Problem Understanding</h4><p>${escapeHtml(question)}</p><h4>⚡ Approach</h4><p>${response}</p><h4>💻 Code Solution</h4><pre><code>function solveProblem() { /* Your logic here */ }</code></pre><h4>📊 Complexity Analysis</h4><p>Time Complexity: O(n)</p><p>Space Complexity: O(1)</p>${personalityHint}</div>`;
}

// ============================================
// SCROLL EFFECTS
// ============================================
function initScrollEffects() {
  const scrollTopBtn = document.getElementById("scrollTopBtn");
  const backToTopBtn = document.getElementById("backToTopBtn");
  const setVisibleState = () => {
    const shouldShow = window.scrollY > 500;
    if (scrollTopBtn) scrollTopBtn.classList.toggle("visible", shouldShow);
    if (backToTopBtn) backToTopBtn.classList.toggle("show", shouldShow);
  };
  window.addEventListener("scroll", setVisibleState);
  setVisibleState();
  if (scrollTopBtn) scrollTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  if (backToTopBtn) backToTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add("animate-in"); }); }, { threshold: 0.1 });
  document.querySelectorAll(".topic-card, .problem-card, .interview-card, .dashboard-card").forEach(el => observer.observe(el));
}

function initializeAnimations() {
  const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.style.opacity = "1"; entry.target.style.transform = "translateY(0)"; } }); }, { threshold: 0.1 });
  document.querySelectorAll(".animate-in").forEach(el => { el.style.opacity = "0"; el.style.transform = "translateY(30px)"; el.style.transition = "opacity 0.6s ease, transform 0.6s ease"; observer.observe(el); });
}

// ============================================
// LOCAL STORAGE
// ============================================
function saveUserData() {
  try { userProgress.lastActive = new Date().toISOString(); localStorage.setItem("algoInfinityVerse", JSON.stringify(userProgress)); queueProgressSync(); }
  catch (e) { console.warn("Could not save user data:", e); }
}

function ensureAnalyticsCollections() {
  if (!Array.isArray(userProgress.xpHistory)) userProgress.xpHistory = [];
  if (!Array.isArray(userProgress.quizAttempts)) userProgress.quizAttempts = [];
  if (!Array.isArray(userProgress.practiceEvents)) userProgress.practiceEvents = [];
}

function recordAnalyticsEvent(type, payload = {}) {
  ensureAnalyticsCollections();
  const entry = { type, timestamp: new Date().toISOString(), ...payload };

  if (type === "xp") {
    userProgress.xpHistory.push(entry);
    if (userProgress.xpHistory.length > 120) userProgress.xpHistory = userProgress.xpHistory.slice(-120);
  } else if (type === "quiz") {
    userProgress.quizAttempts.push(entry);
    if (userProgress.quizAttempts.length > 120) userProgress.quizAttempts = userProgress.quizAttempts.slice(-120);
  } else if (type === "practice") {
    userProgress.practiceEvents.push(entry);
    if (userProgress.practiceEvents.length > 200) userProgress.practiceEvents = userProgress.practiceEvents.slice(-200);
  }

  return entry;
}

let cachedSession = null;
let progressSyncTimer = null;

function queueProgressSync() {
  if (location.protocol === "file:") return;
  clearTimeout(progressSyncTimer);
  progressSyncTimer = setTimeout(syncUserProgress, 600);
}

async function syncUserProgress() {
  const session = await getAuthenticatedSession();
  if (!session?.authenticated) return;
  try {
    await fetch("/api/progress", { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: userProgress.name, xp: userProgress.xp, level: userProgress.level, avatar: userProgress.avatar }) });
    updateLeaderboard();
  } catch (e) { console.warn("Could not sync user progress:", e); }
}

async function getAuthenticatedSession() {
  if (window.algoAuth) { cachedSession = window.algoAuth; return cachedSession; }
  if (cachedSession) return cachedSession;
  try { const response = await fetch("/api/session", { credentials: "include" }); cachedSession = response.ok ? await response.json() : { authenticated: false, user: null }; }
  catch { cachedSession = { authenticated: false, user: null }; }
  return cachedSession;
}

function initFlashcardsRevision() {
  console.log("initFlashcardsRevision stub called");
}

function loadUserData() {
  try {
    const saved = localStorage.getItem("algoInfinityVerse");
    if (saved) { const data = JSON.parse(saved); Object.assign(userProgress, data); if (!userProgress.quizScores) userProgress.quizScores = {}; if (!userProgress.completedRoadmapSteps) userProgress.completedRoadmapSteps = []; if (!userProgress.activityData) userProgress.activityData = {}; if (!userProgress.xpHistory) userProgress.xpHistory = []; if (!userProgress.quizAttempts) userProgress.quizAttempts = []; if (!userProgress.practiceEvents) userProgress.practiceEvents = []; if (!userProgress.codingPersonality) userProgress.codingPersonality = { type: "brute-force first", bruteForceCount: 1, slowAccurateCount: 0, greedyCount: 0, overOptimizerCount: 0 }; if (!userProgress.mistakeDna) userProgress.mistakeDna = { offByOneCount: 0, recursionBaseCaseCount: 0, wrongLogicCount: 0, recentLogs: [] }; if (!userProgress.dailyGoals) userProgress.dailyGoals = {}; backfillActivityData(); }
    else { userProgress = { name: "Learner", avatar: "🚀", completedProblems: [], completedDailyChallenges: [], codingPersonality: { type: "brute-force first", bruteForceCount: 1, slowAccurateCount: 0, greedyCount: 0, overOptimizerCount: 0 }, favoriteProblems: [], recentProblems: [], problemNotes: {}, xp: 0, level: 1, streak: 0, freezes: 0, freezeHistory: [], badges: [], completedRoadmapSteps: [], lastActive: null, quizScores: {}, bestQuizTimes: {}, dailyGoals: {}, activityData: {}, xpHistory: [], quizAttempts: [], practiceEvents: [], mistakeDna: { offByOneCount: 0, recursionBaseCaseCount: 0, wrongLogicCount: 0, recentLogs: [] }, revisionSchedule: { arrays: { currentStage: 0, nextReviewDate: null, history: [] }, strings: { currentStage: 0, nextReviewDate: null, history: [] }, linkedlist: { currentStage: 0, nextReviewDate: null, history: [] }, trees: { currentStage: 0, nextReviewDate: null, history: [] }, graphs: { currentStage: 0, nextReviewDate: null, history: [] }, dp: { currentStage: 0, nextReviewDate: null, history: [] } } }; saveUserData(); }
  } catch (e) { console.error("Error loading user data:", e); userProgress = { name: "Learner", avatar: "🚀", completedProblems: [], completedDailyChallenges: [], codingPersonality: { type: "brute-force first", bruteForceCount: 1, slowAccurateCount: 0, greedyCount: 0, overOptimizerCount: 0 }, favoriteProblems: [], recentProblems: [], problemNotes: {}, xp: 0, level: 1, streak: 0, freezes: 0, freezeHistory: [], badges: [], completedRoadmapSteps: [], lastActive: null, quizScores: {}, bestQuizTimes: {}, dailyGoals: {}, activityData: {}, xpHistory: [], quizAttempts: [], practiceEvents: [], mistakeDna: { offByOneCount: 0, recursionBaseCaseCount: 0, wrongLogicCount: 0, recentLogs: [] }, revisionSchedule: { arrays: { currentStage: 0, nextReviewDate: null, history: [] }, strings: { currentStage: 0, nextReviewDate: null, history: [] }, linkedlist: { currentStage: 0, nextReviewDate: null, history: [] }, trees: { currentStage: 0, nextReviewDate: null, history: [] }, graphs: { currentStage: 0, nextReviewDate: null, history: [] }, dp: { currentStage: 0, nextReviewDate: null, history: [] } } }; saveUserData(); }
  updateProfile();
  getAuthenticatedSession().then(session => { if (session?.user?.name) { userProgress.name = session.user.name; updateProfile(); saveUserData(); } else { userProgress.name = "Learner"; updateProfile(); saveUserData(); } initProfile(); });
}

// ============================================
// ACTIVITY HEATMAP
// ============================================
function recordDailyActivity(problemCount = 1) {
  if (!userProgress.activityData) userProgress.activityData = {};
  const today = new Date();
  const dateKey = formatDateKey(today);
  userProgress.activityData[dateKey] = (userProgress.activityData[dateKey] || 0) + problemCount;
  recordAnalyticsEvent("practice", { dateKey, problemCount });
}

function backfillActivityData() {
  if (!userProgress.activityData) userProgress.activityData = {};
  const lastActive = userProgress.lastActive ? new Date(userProgress.lastActive) : null;
  const anchor = lastActive || new Date();
  const total = userProgress.completedProblems.length;
  if (total > 0) {
    const today = new Date();
    let day = new Date(anchor);
    for (let i = 0; i < total; i++) {
      const key = formatDateKey(day);
      if (!userProgress.activityData[key]) userProgress.activityData[key] = 1;
      else userProgress.activityData[key] += 1;
      day.setDate(day.getDate() - 1);
      if (day > today) { day.setDate(today.getDate()); break; }
    }
  }
}

function formatDateKey(date) { const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, "0"); const d = String(date.getDate()).padStart(2, "0"); return `${y}-${m}-${d}`; }

function parseDateKey(key) { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d); }

function getActivityLevel(count) { if (!count || count === 0) return 0; if (count === 1) return 1; if (count === 2) return 2; if (count <= 4) return 3; return 4; }

function renderActivityHeatmap() {
  const container = document.getElementById("activityHeatmap");
  if (!container) return;
  const activityData = userProgress.activityData || {};
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const WEEKS_TO_SHOW = 52;
  const dayOfWeek = today.getDay();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (WEEKS_TO_SHOW * 7 - 1) - dayOfWeek);
  startDate.setHours(0, 0, 0, 0);
  const weeks = [];
  const monthLabels = [];
  let currentWeek = [];
  let prevMonth = -1;
  const d = new Date(startDate);
  for (let i = 0; i < WEEKS_TO_SHOW * 7; i++) {
    const dow = d.getDay();
    if (dow === 0 && currentWeek.length > 0) { weeks.push(currentWeek); currentWeek = []; }
    currentWeek.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);
  weeks.forEach((week, wi) => { const thuIdx = Math.min(4, week.length - 1); const thuDate = week[thuIdx]; const month = thuDate.getMonth(); if (month !== prevMonth) { const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]; monthLabels.push({ weekIndex: wi, label: monthNames[month] }); prevMonth = month; } });
  const weekdayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];
  let html = "";
  html += '<div class="heatmap-months-row">';
  monthLabels.forEach(ml => { html += `<span class="heatmap-month-label" style="grid-column:${ml.weekIndex + 2}">${ml.label}</span>`; });
  html += "</div>";
  html += '<div class="heatmap-grid"><div class="heatmap-weekday-labels">';
  weekdayLabels.forEach(label => { html += `<span class="heatmap-weekday-label">${label}</span>`; });
  html += "</div>";
  weeks.forEach(week => {
    html += '<div class="heatmap-week">';
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      if (dayIdx < week.length) {
        const date = week[dayIdx];
        const dateKey = formatDateKey(date);
        const count = activityData[dateKey] || 0;
        const level = getActivityLevel(count);
        const isFuture = date > today;
        html += `<div class="heatmap-day" data-level="${isFuture ? -1 : level}" data-date="${dateKey}" data-count="${count}" data-future="${isFuture}" title="${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}: ${count} ${count === 1 ? 'problem' : 'problems'} solved"></div>`;
      } else html += '<div class="heatmap-day" data-future="true"></div>';
    }
    html += "</div>";
  });
  html += "</div>";
  container.innerHTML = html;
  attachHeatmapTooltips();
}

function attachHeatmapTooltips() {
  const tooltip = document.getElementById("heatmapTooltip");
  if (!tooltip) return;
  if (tooltip.parentElement !== document.body) document.body.appendChild(tooltip);
  const days = document.querySelectorAll(".heatmap-day:not([data-future='true'])");
  days.forEach(day => {
    day.addEventListener("mouseenter", (e) => {
      const date = day.dataset.date;
      const count = parseInt(day.dataset.count) || 0;
      const parsed = parseDateKey(date);
      const dateStr = parsed.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      tooltip.innerHTML = `<strong>${dateStr}</strong>${count} ${count === 1 ? 'problem' : 'problems'} solved`;
      tooltip.classList.add("visible");
      positionHeatmapTooltip(e);
    });
    day.addEventListener("mousemove", positionHeatmapTooltip);
    day.addEventListener("mouseleave", () => tooltip.classList.remove("visible"));
  });
}

function positionHeatmapTooltip(e) {
  const tooltip = document.getElementById("heatmapTooltip");
  if (!tooltip) return;
  const rect = tooltip.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let left = e.clientX + 14;
  let top = e.clientY - rect.height - 12;
  if (left + rect.width + 8 > vw) left = e.clientX - rect.width - 14;
  if (top < 8) top = e.clientY + 12;
  if (left < 8) left = 8;
  if (left + rect.width + 8 > vw) left = vw - rect.width - 8;
  if (top + rect.height + 8 > vh) top = vh - rect.height - 8;
  tooltip.style.left = left + "px";
  tooltip.style.top = top + "px";
}

function updateStreak() {
  const today = new Date();
  const lastActive = userProgress.lastActive ? new Date(userProgress.lastActive) : null;
  if (lastActive) {
    const diffDays = getDaysDifference(lastActive, today);
    if (diffDays > 1) userProgress.streak = 1;
    else if (diffDays === 0) { /* already active today */ }
    else {
      let daysMissed = diffDays > 0 ? diffDays - 1 : 0;
      while (daysMissed > 0 && userProgress.freezes > 0) { userProgress.freezes -= 1; daysMissed -= 1; userProgress.freezeHistory.push({ date: new Date(today.getTime() - (daysMissed + 1) * 24 * 60 * 60 * 1000).toISOString(), reason: "Missed day automatically frozen" }); }
      if (daysMissed > 0) userProgress.streak = 1;
      else { userProgress.streak += 1; if (userProgress.streak > 0 && userProgress.streak % 7 === 0) { userProgress.freezes += 1; showNotification("Milestone reached! You earned a Streak Freeze!", "success"); } }
    }
  } else userProgress.streak = 1;
  userProgress.lastActive = today.toISOString();
}

function getDaysDifference(date1, date2) {
  const d1 = new Date(date1);
  d1.setHours(0, 0, 0, 0);
  const d2 = new Date(date2);
  d2.setHours(0, 0, 0, 0);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

// ============================================
// QUIZ EDITOR
// ============================================
function openQuizEditor(problem) {
  currentProblem = problem;
  const modal = document.getElementById("quizEditorModal");
  if (!modal) return;
  const quizTitle = document.getElementById("quizTitle");
  if (quizTitle) quizTitle.textContent = problem.title;
  const quizTopicBadge = document.getElementById("quizTopicBadge");
  if (quizTopicBadge) quizTopicBadge.textContent = problem.tags.join(", ");
  const quizDifficulty = document.getElementById("quizDifficulty");
  if (quizDifficulty) {
    quizDifficulty.textContent = problem.difficulty;
    quizDifficulty.className = "quiz-difficulty difficulty-" + problem.difficulty;
  }
  const descEl = document.getElementById("quizDescription");
  if (descEl) {
    if (problem.description) {
      let descHTML = problem.description;
      if (problem.constraints) descHTML += "<br><br><strong>Constraints:</strong><br>" + problem.constraints.map(c => `• ${c}`).join("<br>");
      descEl.innerHTML = descHTML;
    } else descEl.textContent = `Solve the "${problem.title}" problem.`;
  }
  const quizExamples = document.getElementById("quizExamples");
  if (quizExamples) quizExamples.innerHTML = generateExamples(problem);
  renderTestCases(generateTestCases(problem));
  const editor = document.getElementById("codeEditor");
  const langSelect = document.getElementById("languageSelect");
  const lang = langSelect ? langSelect.value : "javascript";
  const defaultCode = getDefaultCode(lang, problem);
  const savedDraft = getEditorDraft(problem.id);
  if (editor) {
    let code = defaultCode;
    if (savedDraft !== null) {
      const draftSig = getEditorDraftSignature(problem.id);
      const currentSig = getProblemSignature(problem);
      const isStale = draftSig === null || draftSig !== currentSig;
      code = isStale ? defaultCode : savedDraft;
      if (isStale) clearEditorDraft(problem.id);
    }
    editor.value = code;
    editor.scrollTop = 0;
    editor.scrollLeft = 0;
    editor.dispatchEvent(new Event('input'));
  }
  updateEditorDisplayMode();
  clearQuizOutput();
  const outputPanel = document.getElementById('outputPanel');
  const outputIcon = document.getElementById('outputToggleIcon');
  if (outputPanel) outputPanel.classList.remove('collapsed');
  if (outputIcon) { outputIcon.classList.remove('fa-chevron-up'); outputIcon.classList.add('fa-chevron-down'); }

  // CSP-safe button bindings (guard prevents duplicate listeners)
  if (!window.__quizButtonsBound) {
    window.__quizButtonsBound = true;
    document.getElementById('quizRunBtn')?.addEventListener('click', runQuizCode);
    document.getElementById('quizSubmitBtn')?.addEventListener('click', submitQuizCode);
    document.getElementById('quizModalClose')?.addEventListener('click', closeQuizEditor);
    document.getElementById('outputHeader')?.addEventListener('click', toggleOutputPanel);
  }

  modal.classList.add("active");
  updateLineNumbers();
  syncScroll();

  // Reset notes tabs & load existing notes
  if (typeof switchQuizTab === "function") {
    switchQuizTab('problem');
  }
  const savedNotes = (userProgress.problemNotes && userProgress.problemNotes[problem.id]) || {
    notes: "",
    mnemonics: "",
    pitfalls: "",
    whenToUse: "",
    tags: []
  };
  const actualNotes = typeof savedNotes === "string" ? { notes: savedNotes } : savedNotes;
  
  const noteText = document.getElementById("noteText");
  const mnemonicText = document.getElementById("mnemonicText");
  const pitfallsText = document.getElementById("pitfallsText");
  const whenToUseText = document.getElementById("whenToUseText");
  const noteTags = document.getElementById("noteTags");
  const noteSaveStatus = document.getElementById("noteSaveStatus");
  
  if (noteText) noteText.value = actualNotes.notes || "";
  if (mnemonicText) mnemonicText.value = actualNotes.mnemonics || "";
  if (pitfallsText) pitfallsText.value = actualNotes.pitfalls || "";
  if (whenToUseText) whenToUseText.value = actualNotes.whenToUse || "";
  if (noteTags) noteTags.value = (actualNotes.tags || []).join(", ");
  if (noteSaveStatus) noteSaveStatus.textContent = "";

  const sm2Container = document.getElementById("sm2RatingContainer");
  if (sm2Container) sm2Container.style.display = "none";
}

function mapType(jt, lang) {
  const m = {
    'int[]':  { java: 'int[]', cpp: 'vector<int>', c: 'int*', swift: '[Int]' },
    'int[][]': { java: 'int[][]', cpp: 'vector<vector<int>>', c: 'int**', swift: '[[Int]]' },
    'string[]': { java: 'String[]', cpp: 'vector<string>', c: 'char**', swift: '[String]' },
    'string[][]': { java: 'String[][]', cpp: 'vector<vector<string>>', c: 'char***', swift: '[[String]]' },
    'bool[]': { java: 'boolean[]', cpp: 'vector<bool>', c: 'int*', swift: '[Bool]' },
    'bool[][]': { java: 'boolean[][]', cpp: 'vector<vector<bool>>', c: 'int**', swift: '[[Bool]]' },
    'int':    { java: 'int', cpp: 'int', c: 'int', swift: 'Int' },
    'string': { java: 'String', cpp: 'string', c: 'char*', swift: 'String' },
    'bool':   { java: 'boolean', cpp: 'bool', c: 'int', swift: 'Bool' },
  };
  return m[jt]?.[lang] || 'auto';
}

function getClassTemplate(lang, problem) {
  const fnName = problem.functionName || "LRUCache";
  const params = problem.params || [];

  let docComment = '';
  if (problem.guide) {
    const lines = problem.guide.split('\n');
    const prefix = lang === 'python' ? '# ' : '// ';
    docComment = lines.map(l => prefix + l).join('\n') + '\n';
  }

  const paramStr = params.map((p, i) => {
    const t = mapType('int', lang);
    if (lang === 'cpp') return t + ' ' + p;
    if (lang === 'java') return t + ' ' + p;
    if (lang === 'swift') return '_ ' + p + ': ' + t;
    return p;
  }).join(', ');

  const templates = {
    javascript: docComment + `class ${fnName} {\n    constructor(${paramStr}) {\n        \n    }\n\n    get(key) {\n        \n    }\n\n    put(key, value) {\n        \n    }\n}`,
    python: docComment + `class ${fnName}:\n    def __init__(self, ${params.join(', ')}):\n        pass\n\n    def get(self, key: int) -> int:\n        pass\n\n    def put(self, key: int, value: int) -> None:\n        pass\n`,
    java: `class ${fnName} {\n${docComment.replace(/^(.)/gm, '    $1')}    public ${fnName}(${paramStr}) {\n        \n    }\n\n    public int get(int key) {\n        return 0;\n    }\n\n    public void put(int key, int value) {\n        \n    }\n}`,
    cpp: `#include <unordered_map>\nusing namespace std;\n\n${docComment}class ${fnName} {\npublic:\n    ${fnName}(${paramStr}) {\n        \n    }\n\n    int get(int key) {\n        return 0;\n    }\n\n    void put(int key, int value) {\n        \n    }\n};`,
    c: `${docComment}// Use a struct with function pointers:\ntypedef struct {\n    int capacity;\n} LRUCache;\n\nLRUCache* createLRUCache(int capacity) {\n    return NULL;\n}\n\nint get(LRUCache* cache, int key) {\n    return 0;\n}\n\nvoid put(LRUCache* cache, int key, int value) {\n    \n}`,
    swift: docComment + `class ${fnName} {\n    init(${paramStr}) {\n        \n    }\n\n    func get(_ key: Int) -> Int {\n        return 0\n    }\n\n    func put(_ key: Int, _ value: Int) {\n        \n    }\n}`
  };
  return templates[lang] || templates.javascript;
}

function getDefaultCode(lang, problem) {
  const fnName = problem.functionName || "solution";
  const params = problem.params || [];
  const tc = problem.testCases?.[0];

  const isClass = /^[A-Z]/.test(fnName);
  if (isClass) {
    return getClassTemplate(lang, problem);
  }

  const paramTypes = tc?.input ? tc.input.map(v => mapType(j2t(v), lang)) : [];
  const retType = tc?.expected !== undefined ? mapType(j2t(tc.expected), lang) : 'auto';

  const paramStr = params.length
    ? params.map((p, i) => {
        const t = paramTypes[i] || 'auto';
        if (lang === 'cpp') return t + ' ' + p;
        if (lang === 'c') {
          const origJt = tc?.input ? j2t(tc.input[i]) : null;
          const is2d = origJt === 'int[][]';
          const isArray = origJt && origJt.endsWith('[]');
          if (is2d) return t + ' ' + p + ', int* ' + p + 'Sizes, int ' + p + 'Size';
          if (isArray) return t + ' ' + p + ', int ' + p + 'Size';
          return t + ' ' + p;
        }
        if (lang === 'java') return t + ' ' + p;
        if (lang === 'swift') return '_ ' + p + ': ' + t;
        return p;
      }).join(', ')
    : 'params';

  let docComment = '';
  if (problem.guide) {
    const lines = problem.guide.split('\n');
    const prefix = lang === 'python' ? '# ' : '// ';
    docComment = lines.map(l => prefix + l).join('\n') + '\n';
  }

  const templates = {
    javascript: docComment + "function " + fnName + "(" + (params.join(', ') || 'params') + ") {\n    \n}",
    python: docComment + "def " + fnName + "(" + (params.join(', ') || 'params') + "):\n    pass\n",
    java: "class Solution {\n" + docComment.replace(/^(.)/gm, '    $1') + "    public " + retType + " " + fnName + "(" + paramStr + ") {\n        \n    }\n}",
    cpp: '#include <string>\n#include <stack>\nusing namespace std;\n\n' + docComment + retType + " " + fnName + "(" + paramStr + ") {\n    \n}",
    c: '#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <stdbool.h>\n\n' + docComment + retType + " " + fnName + "(" + paramStr + ") {\n    \n}",
    swift: docComment + "func " + fnName + "(" + paramStr + ") -> " + retType + " {\n    \n}"
  };
  return templates[lang] || templates.javascript;
}

function generateExamples(problem) {
  const examples = { 1: `<strong>Example 1:</strong><br>Input: nums = [2,7,11,15], target = 9<br>Output: [0,1]<br><br><strong>Follow-up:</strong> Can you solve it in O(n) using a Hash Map?`, 2: `<strong>Example 1:</strong><br>Input: s = "()"<br>Output: true<br><br><strong>Follow-up:</strong> Can you solve it in O(n) using a Stack?`, 3: `<strong>Example 1:</strong><br>Input: list1 = [1,2,4], list2 = [1,3,4]<br>Output: [1,1,2,3,4,4]<br><br><strong>Follow-up:</strong> Can you solve it both iteratively and recursively?`, 4: `<strong>Example 1:</strong><br>Input: nums = [-2,1,-3,4,-1,2,1,-5,4]<br>Output: 6<br><br><strong>Follow-up:</strong> Can you solve it using Kadane's Algorithm in O(n)?`, 6: `<strong>Example 1:</strong><br>Input: adjList = [[2,4],[1,3],[2,4],[1,3]]<br>Output: [[2,4],[1,3],[2,4],[1,3]]<br><br><strong>Follow-up:</strong> Can you solve it using both BFS and DFS approaches?`, 7: `<strong>Example 1:</strong><br>Input: nums = [10,9,2,5,3,7,101,18]<br>Output: 4<br><br><strong>Follow-up:</strong> Can you improve from O(n²) to O(n log n) using binary search?`, 9: `<strong>Example 1:</strong><br>Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]<br>Output: 6<br><br><strong>Follow-up:</strong> Can you solve it in O(n) time and O(1) space using the two-pointer technique?`, 10: `<strong>Example 1:</strong><br>Input: head = [1,2,3,4,5]<br>Output: [5,4,3,2,1]<br><br><strong>Follow-up:</strong> Can you solve it both iteratively and recursively?`, 11: `<strong>Example 1:</strong><br>Input: root = [4,2,7,1,3,6,9]<br>Output: [4,7,2,9,6,3,1]<br><br><strong>Follow-up:</strong> Can you solve it both recursively and iteratively using a queue or stack?`, 12: `<strong>Example 1:</strong><br>Input: root = [2,1,3]<br>Output: true<br><br><strong>Follow-up:</strong> Can you solve it without recursion using iterative inorder traversal?`, 14: `<strong>Example 1:</strong><br>Input: nums = [1,2,3,1]<br>Output: 4<br><br><strong>Follow-up:</strong> Can you solve it in O(n) time and O(1) space using DP with two variables?` };
  return examples[problem.id] || "<strong>Example:</strong><br>Solve this problem";
}

function generateTestCases(problem) {
  return problem.testCases || [];
}

function renderTestCases(testCases, results) {
  const container = document.getElementById("quizTestCasesContainer");
  if (!container) return;
  if (results) {
    container.innerHTML = testCases.map((tc, i) => {
      const r = results[i] || {};
      const passed = r.passed;
      const statusClass = passed ? 'passed' : 'failed';
      const icon = passed ? '✓' : '✗';
      const label = passed ? 'PASS' : 'FAIL';
      const actualStr = r.actual !== undefined && r.actual !== null ? JSON.stringify(r.actual) : '';
      const errorStr = r.error || '';
      return `<div class="test-case ${r.ran ? statusClass : ''}">
        <div class="test-case-header">
          <span class="test-case-name">Test ${i + 1}</span>
          <span class="test-case-result ${r.ran ? statusClass : 'pending'}">
            ${r.ran ? `${icon} ${label}` : '⏳ Pending'}
          </span>
        </div>
        <div class="test-case-details">
          <div class="test-case-input">Input: <code>${Array.isArray(tc.input) ? tc.input.map(v => JSON.stringify(v)).join(', ') : JSON.stringify(tc.input)}</code></div>
          <div class="test-case-expected">Expected: <code>${JSON.stringify(tc.expected)}</code></div>
          ${r.ran && (passed !== undefined) ? `<div class="test-case-actual">Actual: <code>${actualStr || errorStr}</code></div>` : ''}
        </div>
      </div>`;
    }).join("");
  } else {
    container.innerHTML = testCases.map((tc, i) => `
      <div class="test-case">
        <div class="test-case-header">
          <span class="test-case-name">Test ${i + 1}</span>
          <span class="test-case-result pending">⏳ Pending</span>
        </div>
        <div class="test-case-details">
          <div class="test-case-input">Input: <code>${Array.isArray(tc.input) ? tc.input.map(v => JSON.stringify(v)).join(', ') : JSON.stringify(tc.input)}</code></div>
          <div class="test-case-expected">Expected: <code>${JSON.stringify(tc.expected)}</code></div>
        </div>
      </div>
    `).join("");
  }
}

function clearQuizOutput() {
  const el = document.getElementById("quizOutputContent");
  if (el) el.innerHTML = '<p class="output-placeholder">Run your code to see output...</p>';
}

function buildHarnessCode(code, lang, functionName, testCases, problem) {
  const isClass = problem ? /^[A-Z]/.test(problem.functionName || "") : /^[A-Z]/.test(functionName);
  const tcJson = JSON.stringify(testCases);
  if (lang === "javascript") {
    const clsCheck = isClass ? 'true' : 'false';
    return code + `\n\nconst __TC__ = ${tcJson};\nconst __RES__ = [];\nfor (let i = 0; i < __TC__.length; i++) {\n  const tc = __TC__[i];\n  try {\n    let result;\n    if (${clsCheck}) {\n      const instance = new ${functionName}(...tc.input);\n      if (tc.methods && Array.isArray(tc.methods)) {\n        result = instance;\n        for (const m of tc.methods) {\n          result = instance[m[0]](...m.slice(1));\n        }\n      } else {\n        result = instance;\n      }\n    } else {\n      result = ${functionName}(...tc.input);\n    }\n    const passed = ${clsCheck} ? (tc.methods ? JSON.stringify(result) === JSON.stringify(tc.expected) : true) : JSON.stringify(result) === JSON.stringify(tc.expected);\n    __RES__.push({ index: i, ran: true, passed, actual: ${clsCheck} ? (tc.methods ? result : "instance") : result, expected: tc.expected, input: tc.input, error: null });\n  } catch (e) {\n    __RES__.push({ index: i, ran: true, passed: false, actual: null, expected: tc.expected, input: tc.input, error: e.message });\n  }\n}\nconsole.log("__RESULT__:" + JSON.stringify(__RES__));`;
  }
  if (lang === "python") {
    const esc = tcJson.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const clsCheck = isClass ? 'True' : 'False';
    return `${code}\n\nimport json\n__TC__ = json.loads('${esc}')\n__RES__ = []\nfor i, tc in enumerate(__TC__):\n    try:\n        instance = ${functionName}(*tc["input"])\n        if ${clsCheck} and tc.get("methods"):\n            result = instance\n            for m in tc["methods"]:\n                result = getattr(instance, m[0])(*m[1:])\n        elif ${clsCheck}:\n            result = instance\n        else:\n            result = ${functionName}(*tc["input"])\n        passed = True if ${clsCheck} and not tc.get("methods") else json.dumps(result, default=str) == json.dumps(tc["expected"], default=str)\n        __RES__.append({"index": i, "ran": True, "passed": passed, "actual": str(result) if ${clsCheck} and not tc.get("methods") else result, "expected": tc["expected"], "input": tc["input"], "error": None})\n    except Exception as e:\n        __RES__.append({"index": i, "ran": True, "passed": False, "actual": None, "expected": tc["expected"], "input": tc["input"], "error": str(e)})\nprint("__RESULT__:" + json.dumps(__RES__, default=str))`;
  }
  if (lang === "cpp") {
    return genCppHarness(code, functionName, testCases, isClass);
  }
  if (lang === "java") {
    return genJavaHarness(code, functionName, testCases, isClass);
  }
  if (lang === "c") {
    return genCHarness(code, functionName, testCases, isClass);
  }
  if (lang === "swift") {
    return genSwiftHarness(code, functionName, testCases, isClass);
  }
  return code;
}

function j2t(v) {
  if (v === null || v === undefined) return 'null';
  if (Array.isArray(v)) {
    if (v.length === 0) return 'int[]';
    const inner = j2t(v[0]);
    if (inner === 'null') return 'int[]';
    return inner + '[]';
  }
  if (typeof v === 'number') return 'int';
  if (typeof v === 'string') return 'string';
  if (typeof v === 'boolean') return 'bool';
  return 'int';
}

function valToLit(v, t) {
  if (t === 'int[]') return '[' + v.map(x => x === null || x === undefined ? 0 : x).join(',') + ']';
  if (t === 'string') return '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  if (t === 'bool') return v ? 'true' : 'false';
  if (t === 'string[]') return '[' + v.map(x => '"' + String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',') + ']';
  if (t === 'string[][]') return '[' + v.map(row => '[' + row.map(x => '"' + String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',') + ']').join(',') + ']';
  return String(v);
}

function genCppHarness(code, fn, tcs, isClass) {
  const outType = j2t(tcs[0].expected);
  const inTypes = tcs[0].input.map(v => j2t(v));
  let s = '#include <iostream>\n#include <string>\n#include <vector>\n#include <sstream>\nusing namespace std;\n\n';
  s += code + '\n\n';
  s += 'string __j(bool v) { return v ? "true" : "false"; }\n';
  s += 'string __j(int v) { return to_string(v); }\n';
  s += 'string __j(const string& v) { return "\\"" + v + "\\""; }\n';
  s += 'template<typename T>\nstring __j(const vector<T>& v) {\n  if (v.empty()) return "[]";\n  stringstream ss;\n  ss << "[" << __j(v[0]);\n  for (size_t i=1;i<v.size();i++) ss << "," << __j(v[i]);\n  ss << "]";\n  return ss.str();\n}\n';
  s += 'int main() {\n  cout << "__RESULT__:";\n  cout << "[";\n';
  for (let i = 0; i < tcs.length; i++) {
    if (i > 0) s += '  cout << ",";\n';
    s += '  try {\n';
    let callArgs = '';
    for (let j = 0; j < inTypes.length; j++) {
      if (j > 0) callArgs += ', ';
      if (inTypes[j] === 'int[]') callArgs += 'vector<int>{' + tcs[i].input[j].map(x => x === null || x === undefined ? 0 : x).join(',') + '}';
      else if (inTypes[j] === 'int[][]') callArgs += 'vector<vector<int>>{' + tcs[i].input[j].map(row => '{' + row.join(',') + '}').join(',') + '}';
      else if (inTypes[j] === 'string[]') callArgs += 'vector<string>{' + tcs[i].input[j].map(x => '"' + String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',') + '}';
      else if (inTypes[j] === 'string[][]') callArgs += 'vector<vector<string>>{' + tcs[i].input[j].map(row => '{' + row.map(x => '"' + String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',') + '}').join(',') + '}';
      else callArgs += valToLit(tcs[i].input[j], inTypes[j]);
    }
    s += '    auto __r = ' + fn + '(' + callArgs + ');\n';
    s += '    cout << "{\\"index\\":' + i + ',\\"ran\\":true,\\"passed\\":";\n';
    let compExpr = '"false"';
    if (outType === 'int[]') {
      compExpr = '(__r == vector<int>{' + tcs[i].expected.map(x => x === null || x === undefined ? 0 : x).join(',') + '} ? "true" : "false")';
    } else if (outType === 'int[][]') {
      compExpr = '(__r == vector<vector<int>>{' + tcs[i].expected.map(row => '{' + row.join(',') + '}').join(',') + '} ? "true" : "false")';
    } else if (outType === 'int') {
      compExpr = '(__r == ' + valToLit(tcs[i].expected, outType) + ' ? "true" : "false")';
    } else if (outType === 'string') {
      compExpr = '(__r == ' + valToLit(tcs[i].expected, outType) + ' ? "true" : "false")';
    } else if (outType === 'bool') {
      compExpr = '(__r == ' + valToLit(tcs[i].expected, outType) + ' ? "true" : "false")';
    } else {
      compExpr = '"false"';
    }
    s += '    cout << ' + compExpr + ';\n';
    s += '    cout << ",\\"actual\\":" << __j(__r);\n';
    s += '    cout << "}" << flush;\n';
    s += '  } catch (...) {\n';
    s += '    cout << "{\\"index\\":' + i + ',\\"ran\\":true,\\"passed\\":false,\\"error\\":\\"exception\\"}" << flush;\n';
    s += '  }\n';
  }
  s += '  cout << "]" << endl;\n  return 0;\n}\n';
  return s;
}

function genJavaHarness(code, fn, tcs, isClass) {
  const outType = j2t(tcs[0].expected);
  const inTypes = tcs[0].input.map(v => j2t(v));
  const javaType = outType === 'int[]' ? 'int[]' : outType === 'int[][]' ? 'int[][]' : outType === 'string' ? 'String' : outType === 'bool' ? 'boolean' : 'int';
  let s = code + '\n\nclass Main {\n';
  s += '  static String __j(boolean v) { return String.valueOf(v); }\n';
  s += '  static String __j(int v) { return String.valueOf(v); }\n';
  s += '  static String __j(String v) { return v == null ? "null" : "\\"" + v + "\\""; }\n';
  s += '  static String __j(int[] v) {\n    if (v == null) return "null";\n    StringBuilder sb = new StringBuilder("[");\n    for (int i = 0; i < v.length; i++) { if (i > 0) sb.append(","); sb.append(v[i]); }\n    sb.append("]");\n    return sb.toString();\n  }\n';
  s += '  static boolean __eq(int[] a, int[] b) {\n    if (a == null && b == null) return true;\n    if (a == null || b == null || a.length != b.length) return false;\n    for (int i = 0; i < a.length; i++) if (a[i] != b[i]) return false;\n    return true;\n  }\n';
  if (outType === 'int[][]') {
    s += '  static String __j(int[][] v) {\n    if (v == null) return "null";\n    StringBuilder sb = new StringBuilder("[");\n    for (int i = 0; i < v.length; i++) { if (i > 0) sb.append(","); sb.append(__j(v[i])); }\n    sb.append("]");\n    return sb.toString();\n  }\n';
    s += '  static boolean __eq(int[][] a, int[][] b) {\n    if (a == null && b == null) return true;\n    if (a == null || b == null || a.length != b.length) return false;\n    for (int i = 0; i < a.length; i++) if (!__eq(a[i], b[i])) return false;\n    return true;\n  }\n';
  }
  s += '  public static void main(String[] args) {\n    StringBuilder __res = new StringBuilder("[");\n';
  for (let i = 0; i < tcs.length; i++) {
    if (i > 0) s += '    __res.append(",");\n';
    s += '    try {\n';
    let callArgs = '';
    for (let j = 0; j < inTypes.length; j++) {
      if (j > 0) callArgs += ', ';
      if (inTypes[j] === 'int[]') callArgs += 'new int[]{' + tcs[i].input[j].map(x => x === null || x === undefined ? 0 : x).join(',') + '}';
      else if (inTypes[j] === 'int[][]') callArgs += 'new int[][]{' + tcs[i].input[j].map(row => '{' + row.join(',') + '}').join(',') + '}';
      else if (inTypes[j] === 'string[]') callArgs += 'new String[]{' + tcs[i].input[j].map(x => '"' + String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',') + '}';
      else if (inTypes[j] === 'string[][]') callArgs += 'new String[][]{' + tcs[i].input[j].map(row => '{' + row.map(x => '"' + String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',') + '}').join(',') + '}';
      else callArgs += valToLit(tcs[i].input[j], inTypes[j]);
    }
    s += '      ' + javaType + ' __r = new Solution().' + fn + '(' + callArgs + ');\n';
    if (outType === 'int[]') {
      s += '      boolean __p = __eq(__r, new int[]{' + tcs[i].expected.map(x => x === null || x === undefined ? 0 : x).join(',') + '});\n';
    } else if (outType === 'int[][]') {
      s += '      boolean __p = __eq(__r, new int[][]{' + tcs[i].expected.map(row => '{' + row.join(',') + '}').join(',') + '});\n';
    } else {
      s += '      boolean __p = __r == ' + valToLit(tcs[i].expected, outType) + ';\n';
    }
    s += '      __res.append("{\\"index\\":' + i + ',\\"ran\\":true,\\"passed\\":" + __p + ",\\"actual\\":" + __j(__r) + "}");\n';
    s += '    } catch (Exception e) {\n';
    s += '      __res.append("{\\"index\\":' + i + ',\\"ran\\":true,\\"passed\\":false,\\"error\\":\\"" + (e.getMessage() != null ? e.getMessage().replace("\\"","\'") : "null") + "\\"}");\n';
    s += '    }\n';
  }
  s += '    __res.append("]");\n    System.out.println("__RESULT__:" + __res.toString());\n  }\n}\n';
  return s;
}

function genCHarness(code, fn, tcs, isClass) {
  const outType = j2t(tcs[0].expected);
  const inTypes = tcs[0].input.map(v => j2t(v));
  let s = '#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <stdbool.h>\n\n';
  s += code + '\n\n';
  if (outType === 'int[]') {
    s += 'void __j(int* v, int n, char* buf) {\n  if (v == NULL) { strcpy(buf, "null"); return; }\n  buf[0] = \'[\'; int pos = 1;\n  for (int i = 0; i < n; i++) { if (i > 0) buf[pos++] = \',\'; pos += sprintf(buf + pos, "%d", v[i]); }\n  buf[pos++] = \']\'; buf[pos] = 0;\n}\n';
    s += 'int __eq(int* a, int* b, int n) {\n  if (n == 0) return 1;\n  if (a == NULL && b == NULL) return 1;\n  if (a == NULL || b == NULL) return 0;\n  for (int i = 0; i < n; i++) if (a[i] != b[i]) return 0;\n  return 1;\n}\n';
  }
  if (outType === 'int[][]') {
    s += 'void __j(int** v, int* sizes, int n, char* buf) {\n  if (v == NULL) { strcpy(buf, "null"); return; }\n  buf[0] = \'[\'; int pos = 1;\n  for (int i = 0; i < n; i++) {\n    if (i > 0) buf[pos++] = \',\';\n    buf[pos++] = \'[\';\n    for (int j = 0; j < sizes[i]; j++) {\n      if (j > 0) buf[pos++] = \',\';\n      pos += sprintf(buf + pos, "%d", v[i][j]);\n    }\n    buf[pos++] = \']\';\n  }\n  buf[pos++] = \']\'; buf[pos] = 0;\n}\n';
    s += 'int __eq(int** a, int* aSizes, int aLen, int** b, int* bSizes, int bLen) {\n  if (a == NULL && b == NULL) return 1;\n  if (a == NULL || b == NULL || aLen != bLen) return 0;\n  for (int i = 0; i < aLen; i++) {\n    if (aSizes[i] == 0 && bSizes[i] == 0) continue;\n    if (a[i] == NULL || b[i] == NULL || aSizes[i] != bSizes[i]) return 0;\n    for (int j = 0; j < aSizes[i]; j++) if (a[i][j] != b[i][j]) return 0;\n  }\n  return 1;\n}\n';
  }
  s += 'int main() {\n  printf("__RESULT__:[");\n';
  for (let i = 0; i < tcs.length; i++) {
    if (i > 0) s += '  printf(",");\n';
    s += '  {\n';
    let callArgs = '';
    for (let j = 0; j < inTypes.length; j++) {
      if (j > 0) callArgs += ', ';
      if (inTypes[j] === 'int[]') {
        const arr = tcs[i].input[j];
        if (arr.length === 0) {
          callArgs += 'NULL, 0';
        } else {
          callArgs += '(int[]){' + arr.map(x => x).join(',') + '}, ' + arr.length;
        }
      } else if (inTypes[j] === 'int[][]') {
        const arr = tcs[i].input[j];
        if (arr.length === 0) {
          callArgs += 'NULL, NULL, 0';
        } else {
          const rows = arr.map(row => row.length === 0 ? 'NULL' : '(int[]){' + row.join(',') + '}').join(',');
          const sizes = arr.map(row => row.length).join(',');
          callArgs += '(int*[]){' + rows + '}, (int[]){' + sizes + '}, ' + arr.length;
        }
      } else if (inTypes[j] === 'string[]') {
        const arr = tcs[i].input[j];
        callArgs += '(char*[]){' + arr.map(x => '"' + String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',') + '}, ' + arr.length;
      } else if (inTypes[j] === 'string[][]') {
        const arr = tcs[i].input[j];
        if (arr.length === 0) {
          callArgs += 'NULL, NULL, 0';
        } else {
          const rows = arr.map(row => row.length === 0 ? 'NULL' : '(char*[]){' + row.map(x => '"' + String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',') + '}').join(',');
          const sizes = arr.map(row => row.length).join(',');
          callArgs += '(char***){' + rows + '}, (int[]){' + sizes + '}, ' + arr.length;
        }
      } else callArgs += valToLit(tcs[i].input[j], inTypes[j]);
    }
    if (isClass) {
      s += '  printf("{\\"index\\":' + i + ',\\"ran\\":true,\\"passed\\":true,\\"actual\\":\\"instance\\"}");\n';
    } else if (outType === 'int[]') {
      const exp = tcs[i].expected;
      const expLen = Array.isArray(exp) ? exp.length : 1;
      s += '  printf("{\\"index\\":' + i + ',\\"ran\\":true,\\"passed\\":");\n';
      s += '  int* __r = ' + fn + '(' + callArgs + ');\n';
      if (expLen === 0) {
        s += '  int __p = __eq(__r, NULL, 0);\n';
      } else {
        s += '  int __p = __eq(__r, (int[]){' + exp.map(x => x === null || x === undefined ? 0 : x).join(',') + '}, ' + expLen + ');\n';
      }
      s += '  printf(__p ? "true" : "false");\n  printf(",\\"actual\\":");\n  char __buf[256]; __j(__r, ' + expLen + ', __buf); printf("%s", __buf);\n  printf("}");\n';
    } else if (outType === 'int[][]') {
      const exp2d = tcs[i].expected;
      const expLen = exp2d.length;
      s += '  int** __r = ' + fn + '(' + callArgs + ');\n';
      if (expLen === 0) {
        s += '  int __p = 1;\n';
        s += '  printf("true");\n  printf(",\\"actual\\":[]");\n  printf("}");\n';
      } else {
        const expRows = exp2d.map(row => row.length === 0 ? 'NULL' : '(int[]){' + row.join(',') + '}').join(',');
        const expSizes = exp2d.map(row => row.length).join(',');
        s += '  int __p = __eq(__r, (int[]){' + expSizes + '}, ' + expLen + ', (int*[]){' + expRows + '}, (int[]){' + expSizes + '}, ' + expLen + ');\n';
        s += '  printf(__p ? "true" : "false");\n  printf(",\\"actual\\":");\n  char __buf[1024]; __j(__r, (int[]){' + expSizes + '}, ' + expLen + ', __buf); printf("%s", __buf);\n  printf("}");\n';
      }
    } else {
      const cType = outType === 'string' ? 'char*' : 'int';
      s += '  printf("{\\"index\\":' + i + ',\\"ran\\":true,\\"passed\\":");\n';
      s += '  ' + cType + ' __r = ' + fn + '(' + callArgs + ');\n';
      if (outType === 'string') {
        const expStr = valToLit(tcs[i].expected, outType);
        s += '  int __p = __r && ' + expStr + ' && strcmp(__r, ' + expStr + ') == 0;\n';
      } else {
        s += '  int __p = __r == ' + valToLit(tcs[i].expected, outType) + ';\n';
      }
      s += '  printf(__p ? "true" : "false");\n  printf(",\\"actual\\":");\n';
      if (outType === 'string') s += '  printf(__r ? "\\"%s\\"" : "null", __r);\n';
      else if (outType === 'bool') s += '  printf(__r ? "true" : "false");\n';
      else s += '  printf("%d", __r);\n';
      s += '  printf("}");\n';
    }
    s += '  }\n';
  }
  s += '  printf("]\\n");\n  return 0;\n}\n';
  return s;
}

function genSwiftHarness(code, fn, tcs, isClass) {
  const outType = j2t(tcs[0].expected);
  const inTypes = tcs[0].input.map(v => j2t(v));
  let s = 'import Foundation\n\n';
  s += code + '\n\n';
  s += 'func __j(_ v: Int) -> String { return String(v) }\n';
  s += 'func __j(_ v: Bool) -> String { return v ? "true" : "false" }\n';
  s += 'func __j(_ v: String) -> String { return "\\"\\(v)\\"" }\n';
  if (outType === 'int[]' || outType === 'int[][]') {
    s += 'func __j(_ v: [Int]) -> String {\n  if v.isEmpty { return "[]" }\n  return "[" + v.map(String.init).joined(separator: ",") + "]"\n}\n';
  }
  if (outType === 'int[][]') {
    s += 'func __j(_ v: [[Int]]) -> String {\n  return "[" + v.map { __j($0) }.joined(separator: ",") + "]"\n}\n';
  }
  s += 'var __res = "["\n';
  for (let i = 0; i < tcs.length; i++) {
    if (i > 0) s += '__res += ","\n';
    s += 'do {\n';
    let callArgs = '';
    for (let j = 0; j < inTypes.length; j++) {
      if (j > 0) callArgs += ', ';
      if (inTypes[j] === 'int[]') callArgs += '[' + tcs[i].input[j].map(x => x === null || x === undefined ? 0 : x).join(',') + '] as [Int]';
      else if (inTypes[j] === 'int[][]') callArgs += '[' + tcs[i].input[j].map(row => '[' + row.join(',') + ']').join(',') + '] as [[Int]]';
      else if (inTypes[j] === 'string[]') callArgs += '[' + tcs[i].input[j].map(x => '"' + String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',') + '] as [String]';
      else if (inTypes[j] === 'string[][]') callArgs += '[' + tcs[i].input[j].map(row => '[' + row.map(x => '"' + String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',') + ']').join(',') + '] as [[String]]';
      else callArgs += valToLit(tcs[i].input[j], inTypes[j]);
    }
    s += '  let __r = ' + fn + '(' + callArgs + ')\n';
    if (outType === 'int[]') {
      s += '  let __p = __r == [' + tcs[i].expected.map(x => x === null || x === undefined ? 0 : x).join(',') + ']\n';
    } else if (outType === 'int[][]') {
      s += '  let __p = __r == [' + tcs[i].expected.map(row => '[' + row.join(',') + ']').join(',') + ']\n';
    } else {
      s += '  let __p = __r == ' + valToLit(tcs[i].expected, outType) + '\n';
    }
    s += '  __res += "{\\"index\\":' + i + ',\\"ran\\":true,\\"passed\\":" + (__p ? "true" : "false") + ",\\"actual\\":" + __j(__r) + "}"\n';
    s += '} catch {\n';
    s += '  __res += "{\\"index\\":' + i + ',\\"ran\\":true,\\"passed\\":false,\\"error\\":\\"exception\\"}"\n';
    s += '}\n';
  }
  s += '__res += "]"\nprint("__RESULT__:" + __res)\n';
  return s;
}

function createSandboxWorker(harnessCode) {
  const blob = new Blob([`self.onmessage=function(e){var logs=[],origLog=console.log;console.log=function(){for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++)args[_key]=arguments[_key];logs.push(args.map(String).join(" "))};try{eval(e.data);self.postMessage({success:true,logs})}catch(error){self.postMessage({success:false,error:error.message,logs})}finally{console.log=origLog}};`], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);
  return { worker, url };
}

function runWorker(harnessCode, timeoutMs) {
  return new Promise((resolve, reject) => {
    const { worker, url } = createSandboxWorker(harnessCode);
    const timer = setTimeout(() => { worker.terminate(); URL.revokeObjectURL(url); reject(new Error("Execution timed out (> " + (timeoutMs / 1000) + "s)")); }, timeoutMs);
    worker.onmessage = (e) => { clearTimeout(timer); worker.terminate(); URL.revokeObjectURL(url); resolve(e.data); };
    worker.onerror = (e) => { clearTimeout(timer); worker.terminate(); URL.revokeObjectURL(url); reject(new Error(e.message || "Worker error")); };
    worker.postMessage(harnessCode);
  });
}

const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? window.location.origin
  : '';

async function executeViaApi(lang, code, originalCode) {
  // Make sure this points to your new secure Node.js route
  const response = await fetch(`${API_BASE}/api/execute`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sourceCode: code,
      originalCode: originalCode,
      language: lang,
      stdin: ""
    })
  });
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: "Execution API error (" + response.status + ")" }));
    throw new Error(err.message || "Failed to execute code");
  }
  
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Execution failed");
  }

  // JDoodle returns output directly
  return { 
    stdout: result.data.output || "", 
    stderr: "", // JDoodle merges stderr into output
    memory: result.data.memory,
    cpuTime: result.data.cpuTime
  };
}

function parseTestResults(stdout, testCount) {
  const marker = "__RESULT__:";
  const pos = stdout.lastIndexOf(marker);
  if (pos !== -1) {
    const raw = stdout.substring(0, pos).trim();
    const json = stdout.substring(pos + marker.length).trim();
    try {
      const parsed = JSON.parse(json);
      const testResults = Array.isArray(parsed) ? parsed : [];
      const allPassed = testResults.length > 0 && testResults.every(r => r.passed);
      return { allPassed, testResults, rawOutput: raw };
    } catch (e) { /* fall through */ }
  }
  return { allPassed: false, testResults: Array(testCount).fill({ ran: false, passed: false, error: "No test result marker found" }), rawOutput: stdout };
}

async function executeCode(code, lang, problem) {
  const testCases = generateTestCases(problem);
  if (!testCases || testCases.length === 0) {
    return { allPassed: false, testResults: [], rawOutput: "This problem has no automated test cases." };
  }
  
  const fnName = problem.functionName || "solution";
  const harnessCode = buildHarnessCode(code, lang, fnName, testCases, problem);
  
  let stdout = "", stderr = "", memory = "", cpuTime = "";
  
  try {
    const result = await executeViaApi(lang, harnessCode, code);
    stdout = result.stdout;
    memory = result.memory;
    cpuTime = result.cpuTime;
  } catch (e) {
    if (lang === "javascript" && isAiInterviewerActive) {
      try {
        const { executeSandboxedCode } = await import('./modules/code-executor.js');
        const logs = await executeSandboxedCode(harnessCode, 5000);
        stdout = logs.join("\n");
      } catch (sandboxErr) {
        return { 
          allPassed: false, 
          testResults: testCases.map(() => ({ ran: false, passed: false, error: sandboxErr.message })), 
          rawOutput: sandboxErr.message 
        };
      }
    } else {
      return { 
        allPassed: false, 
        testResults: testCases.map(() => ({ ran: false, passed: false, error: e.message })), 
        rawOutput: e.message 
      };
    }
  }
  
  const parsedResults = parseTestResults(stdout, testCases.length);
  
  parsedResults.metrics = {
    memory: memory || "N/A",
    cpuTime: cpuTime || "N/A"
  };
  
  return parsedResults;
}

function setOutput(text, type) {
  const el = document.getElementById("quizOutputContent");
  if (!el) return;
  if (type === "running") el.innerHTML = '<p class="output-running">⏳ Running code...</p>';
  else if (type === "error") el.innerHTML = '<pre class="output-error">❌ Error:\n' + text + '</pre>';
  else if (type === "success") el.innerHTML = '<pre class="output-success">✅ ' + text + '</pre>';
  else el.innerHTML = '<pre>' + text + '</pre>';
}

let _running = false;

async function runQuizCode() {
  if (_running) return;
  const editor = document.getElementById("codeEditor");
  if (!editor) return;
  const code = editor.value;
  if (!code.trim()) { setOutput("Please write some code first.", "error"); return; }
  if (!currentProblem) { setOutput("No problem selected.", "error"); return; }
  const langSelect = document.getElementById("languageSelect");
  const lang = langSelect ? langSelect.value : "javascript";
  const problem = currentProblem;
  const testCases = generateTestCases(problem);
  if (!testCases || testCases.length === 0) {
    setOutput("This problem doesn't have automated test cases yet.", "error");
    return;
  }
  renderTestCases(testCases);
  setOutput("", "running");
  _running = true;
  try {
    const result = await executeCode(code, lang, problem);
    if (!result.testResults || !Array.isArray(result.testResults)) {
      setOutput("Execution returned no test results.", "error");
      return;
    }
    renderTestCases(testCases, result.testResults);
    if (result.allPassed) {
      setOutput("All tests passed!", "success");
    } else {
      const failures = result.testResults.filter(r => r && !r.passed);
      const failMsg = failures.length + " / " + result.testResults.length + " tests failed";
      const out = result.rawOutput ? failMsg + "\n\nConsole output:\n" + result.rawOutput : failMsg;
      setOutput(out, "error");
    }
    if (result.metrics && result.metrics.cpuTime) {
      const metricText = `\n\n⏱️ Execution Time: ${result.metrics.cpuTime} sec\n💾 Memory Used: ${result.metrics.memory} KB`;
      const el = document.getElementById("quizOutputContent");
      if (el) el.innerHTML += `<pre style="color:var(--accent); margin-top:10px;">${metricText}</pre>`;
    }
  } catch (e) {
    renderTestCases(testCases);
    setOutput(e.message || "Execution failed", "error");
  } finally {
    _running = false;
  }
}

async function submitQuizCode() {
  if (_running) return;
  const editor = document.getElementById("codeEditor");
  if (!editor) return;
  const code = editor.value;
  if (!code.trim()) { showNotification("Please write some code before submitting!", "error"); return; }
  if (!currentProblem) { showNotification("No problem selected!", "error"); return; }
  const problem = currentProblem;
  if (userProgress.completedProblems.includes(problem.id)) { showNotification("Already completed!", "info"); return; }
  const langSelect = document.getElementById("languageSelect");
  const lang = langSelect ? langSelect.value : "javascript";
  const testCases = generateTestCases(problem);
  if (!testCases || testCases.length === 0) {
    showNotification("This problem doesn't have automated tests. Submit not available.", "error");
    return;
  }
  showNotification("⏳ Running tests...", "info");
  renderTestCases(testCases);
  setOutput("", "running");
  _running = true;
  try {
    const result = await executeCode(code, lang, problem);
    if (!result.testResults || !Array.isArray(result.testResults)) {
      showNotification("Execution returned no test results.", "error");
      return;
    }
    renderTestCases(testCases, result.testResults);
    if (result.allPassed) {
      if (!userProgress.submittedSolutions) userProgress.submittedSolutions = {};
      userProgress.submittedSolutions[problem.id] = { code: code, lang: lang, date: new Date().toISOString() };
      userProgress.completedProblems.push(problem.id);
      const difficulty = problem.difficulty;
      addXP(getXPForDifficulty(difficulty));
      updateStreak();
      recordDailyActivity(1);
      saveUserData();
      updateDashboard();
      updateGamification();
      initRoadmap();
      initTopicsSection();
      renderActivityHeatmap();
      const submittedId = problem.id;
      const sm2Container = document.getElementById("sm2RatingContainer");
      if (sm2Container) {
        sm2Container.style.display = "flex";
      } else {
        closeQuizEditor();
        clearEditorDraft(submittedId);
      }
      showNotification("Problem solved! +" + getXPForDifficulty(difficulty) + " XP. Rate recall difficulty below.", "success");
    } else {
      const failures = result.testResults.filter(r => r && !r.passed);
      setOutput(failures.length + " / " + result.testResults.length + " tests failed. Fix the issues and try again.", "error");
      showNotification(failures.length + " test(s) failed. Keep trying!", "error");
    }
  } catch (e) {
    renderTestCases(testCases);
    setOutput(e.message || "Execution failed", "error");
    showNotification("Execution error: " + (e.message || "Unknown error"), "error");
  } finally {
    _running = false;
  }
}

function getXPForDifficulty(difficulty) { const map = { easy: 100, medium: 250, hard: 500 }; return map[difficulty.toLowerCase()] || 100; }

function closeQuizEditor() { const el = document.getElementById("quizEditorModal"); if (el) el.classList.remove("active"); currentProblem = null; }

function getProblemSignature(problem) {
  return JSON.stringify({
    fn: problem.functionName,
    params: problem.params,
    guide: problem.guide,
    tc: problem.testCases
  });
}

function saveEditorDraft(problemId, code, signature) {
  try {
    localStorage.setItem(`editorDraft_${problemId}`, code);
    if (signature) localStorage.setItem(`editorDraft_sig_${problemId}`, signature);
  } catch (e) { console.warn('Could not save draft:', e); }
}

function getEditorDraft(problemId) { try { return localStorage.getItem(`editorDraft_${problemId}`); } catch (e) { return null; } }

function getEditorDraftSignature(problemId) { try { return localStorage.getItem(`editorDraft_sig_${problemId}`); } catch (e) { return null; } }

function clearEditorDraft(problemId) {
  try {
    localStorage.removeItem(`editorDraft_${problemId}`);
    localStorage.removeItem(`editorDraft_sig_${problemId}`);
  } catch (e) { console.warn('Could not clear draft:', e); }
}

window.addEventListener("resize", () => {
  if (typeof updateLineNumbers === 'function') updateLineNumbers();
  if (typeof syncScroll === 'function') syncScroll();
});

function updateLineNumbers() {
  const editor = document.getElementById("codeEditor");
  const lineNumbers = document.getElementById("lineNumbers");
  if (!editor || !lineNumbers) return;
  const lines = editor.value.split("\n").length;
  lineNumbers.innerHTML = Array.from({ length: Math.max(lines, 1) }, (_, i) => i + 1).join("\n");
}

function syncScroll() {
  const editor = document.getElementById("codeEditor");
  const lineNumbers = document.getElementById("lineNumbers");
  const highlight = document.getElementById('syntaxHighlight');
  if (editor) { if (lineNumbers) lineNumbers.scrollTop = editor.scrollTop; if (highlight) { highlight.scrollTop = editor.scrollTop; highlight.scrollLeft = editor.scrollLeft; } }
  updateCurrentLineHighlight();
}

function updateEditorDisplayMode() {
  const editor = document.getElementById('codeEditor');
  const highlight = document.getElementById('syntaxHighlight');
  if (!editor) return;
  editor.style.setProperty('color', 'transparent', 'important');
  editor.style.setProperty('-webkit-text-fill-color', 'transparent', 'important');
  if (highlight) highlight.hidden = false;
}

function insertSnippet(type) {
  const editor = document.getElementById("codeEditor");
  if (!editor) return;
  const snippets = { for: "for (let i = 0; i < array.length; i++) {\n    \n}", if: "if (condition) {\n    \n} else {\n    \n}", function: "function functionName(params) {\n    \n    return;\n}", while: "while (condition) {\n    \n}", switch: "switch (expression) {\n    case value:\n        break;\n    default:\n        break;\n}" };
  const snippet = snippets[type] || "";
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const before = editor.value.substring(0, start);
  const after = editor.value.substring(end);
  editor.value = before + snippet + after;
  editor.selectionStart = start;
  editor.selectionEnd = start + snippet.length;
  editor.focus();
  editor.dispatchEvent(new Event("input"));
}

function formatCode() {
  const editor = document.getElementById("codeEditor");
  if (!editor) return;
  editor.value = editor.value.split("\n").map(line => line.trimEnd()).join("\n");
  editor.dispatchEvent(new Event("input"));
  updateLineNumbers();
  showNotification("Code formatted", "info");
}

function toggleLineComment() {
  const editor = document.getElementById("codeEditor");
  const lang = document.getElementById("languageSelect").value;
  const lines = editor.value.split("\n");
  const cursorPos = editor.selectionStart;
  const textBefore = editor.value.substring(0, cursorPos);
  const currentLine = textBefore.split("\n").length - 1;
  const commentChars = { javascript: "//", python: "#", java: "//", cpp: "//" };
  const char = commentChars[lang] || "//";
  const line = lines[currentLine];
  if (line.trim().startsWith(char)) lines[currentLine] = line.replace(new RegExp(`^\\s*${char}\\s?`), "");
  else lines[currentLine] = char + " " + line;
  editor.value = lines.join("\n");
  editor.dispatchEvent(new Event("input"));
  updateLineNumbers();
}

function toggleOutputPanel() {
  const panel = document.getElementById('outputPanel');
  const icon = document.getElementById('outputToggleIcon');
  const header = document.getElementById('outputHeader');
  if (!panel) return;
  panel.classList.toggle('collapsed');
  const collapsed = panel.classList.contains('collapsed');
  if (icon) { icon.classList.toggle('fa-chevron-down', !collapsed); icon.classList.toggle('fa-chevron-up', collapsed); }
  if (header) header.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
}

// ============================================
// CODING PERSONALITY
// ============================================
const QUIZ_QUESTIONS = [
  { q: "When starting a new coding problem, what do you do first?", options: [{ text: "Start typing the code immediately to see if it works.", type: "brute-force first" }, { text: "Analyze constraints, define edge cases, and write pseudocode.", type: "slow but accurate" }, { text: "Design a fast greedy heuristic to get a quick correct result.", type: "greedy thinker" }, { text: "Search for hash tables or auxiliary space shortcuts to minimize complexity.", type: "over-optimizer" }] },
  { q: "How do you evaluate time/space complexity?", options: [{ text: "I don't think about it until it gets a Time Limit Exceeded (TLE) error.", type: "brute-force first" }, { text: "I trace the iterations and count nested variables step-by-step.", type: "slow but accurate" }, { text: "I trust locally optimal choices to run fast enough.", type: "greedy thinker" }, { text: "I always structure for O(N) or O(1) space, even if it requires complex code.", type: "over-optimizer" }] },
  { q: "Your solution fails on an empty input. What is your reaction?", options: [{ text: "I patch it with a quick 'if empty return' condition.", type: "brute-force first" }, { text: "I dry-run the loop bounds on paper to understand why it cracked.", type: "slow but accurate" }, { text: "I use simple helper fallback returns.", type: "greedy thinker" }, { text: "I rewrite the index math to prevent empty pointer states altogether.", type: "over-optimizer" }] },
  { q: "What is your main goal when coding?", options: [{ text: "Get green checkmarks as fast as possible.", type: "brute-force first" }, { text: "Write bug-free, clean, and highly readable code.", type: "slow but accurate" }, { text: "Find the simplest, most intuitive logical shortcut.", type: "greedy thinker" }, { text: "Optimize space-time metrics to beat 100% of submissions.", type: "over-optimizer" }] }
];

function openPersonalityQuiz() {
  let modal = document.getElementById("personalityQuizModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "personalityQuizModal";
    modal.innerHTML = `<div class="modal-content personality-quiz-modal-content"><div class="modal-header"><h3>Coding Personality Profiler</h3><button class="modal-close" id="personalityQuizClose">&times;</button></div><div class="modal-body" id="personalityQuizBody"></div></div>`;
    document.body.appendChild(modal);
    const closeBtn = document.getElementById("personalityQuizClose");
    if (closeBtn) closeBtn.addEventListener("click", () => { if (modal) modal.classList.remove("active"); });
  }
  currentQuizIndex = 0;
  quizSelections = [];
  modal.classList.add("active");
  renderPersonalityQuizQuestion();
}

let currentQuizIndex = 0;
let quizSelections = [];

function renderPersonalityQuizQuestion() {
  const container = document.getElementById("personalityQuizBody");
  if (!container) return;
  if (currentQuizIndex >= QUIZ_QUESTIONS.length) { finishPersonalityQuiz(); return; }
  const quest = QUIZ_QUESTIONS[currentQuizIndex];
  container.innerHTML = `<div class="quiz-question-container"><div class="quiz-question-header"><span>Question ${currentQuizIndex + 1} of ${QUIZ_QUESTIONS.length}</span><span>Coding Style Quiz</span></div><p class="quiz-question-text">${quest.q}</p><div class="quiz-answer-options">${quest.options.map((opt, i) => `<div class="quiz-answer-option" data-type="${opt.type}"><div class="quiz-answer-letter">${String.fromCharCode(65 + i)}</div><div class="quiz-answer-text">${opt.text}</div></div>`).join("")}</div></div>`;
  container.querySelectorAll(".quiz-answer-option").forEach(item => {
    item.addEventListener("click", () => {
      item.classList.add("selected");
      quizSelections.push(item.dataset.type);
      setTimeout(() => { currentQuizIndex++; renderPersonalityQuizQuestion(); }, 300);
    });
  });
}

function finishPersonalityQuiz() {
  const counts = { "brute-force first": 0, "over-optimizer": 0, "slow but accurate": 0, "greedy thinker": 0 };
  quizSelections.forEach(type => counts[type] = (counts[type] || 0) + 1);
  let dominantType = "brute-force first", maxCount = -1;
  for (const type in counts) { if (counts[type] > maxCount) { maxCount = counts[type]; dominantType = type; } }
  if (!userProgress.codingPersonality) userProgress.codingPersonality = {};
  userProgress.codingPersonality.type = dominantType;
  userProgress.codingPersonality.bruteForceCount = counts["brute-force first"] + 1;
  userProgress.codingPersonality.overOptimizerCount = counts["over-optimizer"] + 1;
  userProgress.codingPersonality.slowAccurateCount = counts["slow but accurate"] + 1;
  userProgress.codingPersonality.greedyCount = counts["greedy thinker"] + 1;
  saveUserData();
  renderPersonalityCard();
  if (typeof renderProblems === "function") { const searchInput = document.getElementById("searchInput"); const filterActive = document.querySelector(".filter-btn.active"); renderProblems(); }
  const pModal = document.getElementById("personalityQuizModal");
  if (pModal) pModal.classList.remove("active");
  showNotification(`Quiz complete! Your coding personality is: ${dominantType.replace("-", " ").toUpperCase()} 🧠`, "success");
}

function renderPersonalityCard() {
  const pCard = document.getElementById("personalityCard");
  if (!pCard) return;
  const cp = userProgress.codingPersonality || { type: "brute-force first", bruteForceCount: 1, slowAccurateCount: 0, greedyCount: 0, overOptimizerCount: 0 };
  const total = (cp.bruteForceCount || 0) + (cp.slowAccurateCount || 0) + (cp.greedyCount || 0) + (cp.overOptimizerCount || 0) || 1;
  const pctBrute = Math.round(((cp.bruteForceCount || 0) / total) * 100);
  const pctOpt = Math.round(((cp.overOptimizerCount || 0) / total) * 100);
  const pctSlow = Math.round(((cp.slowAccurateCount || 0) / total) * 100);
  const pctGreedy = Math.round(((cp.greedyCount || 0) / total) * 100);
  let icon = "🔎", desc = "", adaptation = "";
  if (cp.type === "brute-force first") { icon = "🔴"; desc = "You jump straight into writing code! You get solutions quickly, but can overlook edge cases."; adaptation = "Focus: Easy/Medium problems with boundary checks"; }
  else if (cp.type === "over-optimizer") { icon = "🟣"; desc = "You love optimal space/time tricks! You always reach for hashes and pointers."; adaptation = "Focus: Medium/Hard problems, clean code style"; }
  else if (cp.type === "slow but accurate") { icon = "🔵"; desc = "You take your time to design solutions. You have low error rates."; adaptation = "Focus: Medium problems, speed practice"; }
  else if (cp.type === "greedy thinker") { icon = "🟢"; desc = "You look for immediate local optimizations."; adaptation = "Focus: Greedy & Dynamic Programming concepts"; }
  pCard.innerHTML = `<h3>🧠 Coding Personality</h3><div class="personality-profile-content"><div class="personality-header-info"><div class="personality-badge-icon">${icon}</div><div class="personality-type-group"><h4 style="text-transform:capitalize;">${cp.type.replace("-", " ")}</h4><span class="adaptation-badge">${adaptation}</span></div></div><p class="personality-description">${desc}</p><div class="style-progress-bars"><div class="style-bar-group"><span class="style-label">Brute-Force First (${pctBrute}%)</span><div class="style-bar-track"><div class="style-bar-fill" id="barBrute" style="width:${pctBrute}%;"></div></div></div><div class="style-bar-group"><span class="style-label">Over-Optimizer (${pctOpt}%)</span><div class="style-bar-track"><div class="style-bar-fill" id="barOpt" style="width:${pctOpt}%;"></div></div></div><div class="style-bar-group"><span class="style-label">Slow but Accurate (${pctSlow}%)</span><div class="style-bar-track"><div class="style-bar-fill" id="barSlow" style="width:${pctSlow}%;"></div></div></div><div class="style-bar-group"><span class="style-label">Greedy Thinker (${pctGreedy}%)</span><div class="style-bar-track"><div class="style-bar-fill" id="barGreedy" style="width:${pctGreedy}%;"></div></div></div></div><div class="personality-actions"><button class="btn btn-secondary btn-mini" id="personalityQuizBtn"><i class="fas fa-redo"></i> Retake Profiler Quiz</button></div></div>`;
  const quizBtn = document.getElementById("personalityQuizBtn");
  if (quizBtn) quizBtn.addEventListener("click", openPersonalityQuiz);
}

// ============================================
// MISTAKE DNA
// ============================================
function logMistake(category, details, problemName) {
  if (!userProgress.mistakeDna) userProgress.mistakeDna = { offByOneCount: 0, recursionBaseCaseCount: 0, wrongLogicCount: 0, recentLogs: [] };
  const md = userProgress.mistakeDna;
  if (category === 'off-by-one') md.offByOneCount = (md.offByOneCount || 0) + 1;
  else if (category === 'recursion') md.recursionBaseCaseCount = (md.recursionBaseCaseCount || 0) + 1;
  else if (category === 'logic') md.wrongLogicCount = (md.wrongLogicCount || 0) + 1;
  if (!md.recentLogs) md.recentLogs = [];
  md.recentLogs.push({ message: details, problem: problemName || "Workspace Practice", date: new Date().toISOString() });
  if (md.recentLogs.length > 5) md.recentLogs.shift();
  saveUserData();
  renderMistakeDnaCard();
}

function renderMistakeDnaCard() {
  const mCard = document.getElementById("mistakeDnaCard");
  if (!mCard) return;
  const md = userProgress.mistakeDna || { offByOneCount: 0, recursionBaseCaseCount: 0, wrongLogicCount: 0, recentLogs: [] };
  const offByOne = md.offByOneCount || 0, recursion = md.recursionBaseCaseCount || 0, wrongLogic = md.wrongLogicCount || 0, total = offByOne + recursion + wrongLogic;
  const pctOff = total > 0 ? Math.round((offByOne / total) * 100) : 0, pctRec = total > 0 ? Math.round((recursion / total) * 100) : 0, pctLogic = total > 0 ? Math.round((wrongLogic / total) * 100) : 0;
  let recommendation = "No mistakes logged yet!", recTitle = "DNA Engine Diagnostic", recColor = "#fb923c", recBorderColor = "#f97316", maxVal = 0;
  if (total > 0) {
    maxVal = Math.max(offByOne, recursion, wrongLogic);
    if (maxVal === offByOne) { recTitle = "Off-by-One / Boundary Alert"; recommendation = "Socratic Hint: Have you verified your loop bounds and empty input checks?"; recColor = "#f59e0b"; recBorderColor = "#f59e0b"; }
    else if (maxVal === recursion) { recTitle = "Recursion Base Case Alert"; recommendation = "Socratic Hint: Does every execution path reach a valid termination state?"; recColor = "#06b6d4"; recBorderColor = "#06b6d4"; }
    else { recTitle = "Wrong Logic Alert"; recommendation = "Socratic Hint: Can we solve this using fewer lookups or with a hash-map?"; recColor = "#ec4899"; recBorderColor = "#ec4899"; }
  }
  const logs = md.recentLogs || [];
  let logsHtml = logs.length === 0 ? `<p class="empty-state" style="font-size:0.8rem;color:var(--text-secondary);margin:0;">No recent mistake traces found.</p>` : [...logs].reverse().slice(0, 5).map(item => `<div class="recent-mistake-log-item"><div><span class="recent-mistake-desc">${escapeHtml(item.message)}</span><span class="recent-mistake-source">Problem: ${escapeHtml(item.problem)}</span></div><span class="recent-mistake-time-badge">${formatMistakeDate(item.date)}</span></div>`).join("");
  mCard.innerHTML = `<h3>🧬 Mistake DNA Tracker</h3><div class="mistake-dna-content"><div class="mistake-dna-header"><div class="mistake-dna-title-group"><span class="mistake-dna-subtitle" style="margin-top:0;">Behavior-Based Error Clustering</span></div><svg class="dna-helix-visualizer" viewBox="0 0 100 40"><g fill="none" stroke-width="2"><path d="M 10,20 Q 25,5 40,20 T 70,20 T 100,20" stroke="url(#dnaGrad1)" opacity="0.6"/><path d="M 10,20 Q 25,35 40,20 T 70,20 T 100,20" stroke="url(#dnaGrad2)" opacity="0.6"/><line x1="25" y1="12" x2="25" y2="28" stroke="rgba(249,115,22,0.4)" stroke-dasharray="2,2"/><line x1="55" y1="12" x2="55" y2="28" stroke="rgba(249,115,22,0.4)" stroke-dasharray="2,2"/><line x1="85" y1="12" x2="85" y2="28" stroke="rgba(249,115,22,0.4)" stroke-dasharray="2,2"/><circle class="dna-node-dot" cx="25" cy="12" r="3" fill="#f59e0b" style="animation-delay:0s;"/><circle class="dna-node-dot" cx="25" cy="28" r="3" fill="#ec4899" style="animation-delay:0.5s;"/><circle class="dna-node-dot" cx="55" cy="12" r="3" fill="#06b6d4" style="animation-delay:1s;"/><circle class="dna-node-dot" cx="55" cy="28" r="3" fill="#f97316" style="animation-delay:1.5s;"/><circle class="dna-node-dot" cx="85" cy="12" r="3" fill="#ef4444" style="animation-delay:0.2s;"/><circle class="dna-node-dot" cx="85" cy="28" r="3" fill="#3b82f6" style="animation-delay:0.7s;"/></g><defs><linearGradient id="dnaGrad1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#f97316"/><stop offset="100%" stop-color="#06b6d4"/></linearGradient><linearGradient id="dnaGrad2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#ec4899"/><stop offset="100%" stop-color="#3b82f6"/></linearGradient></defs></svg></div><div class="mistake-map-bars"><div class="mistake-bar-group"><div class="mistake-bar-label"><span class="category-name">Off-by-One / Boundary Errors</span><span>${offByOne} (${pctOff}%)</span></div><div class="mistake-bar-track"><div class="mistake-bar-fill" id="barOffByOne" style="width:${pctOff}%;"></div></div></div><div class="mistake-bar-group"><div class="mistake-bar-label"><span class="category-name">Recursion Base Case Issues</span><span>${recursion} (${pctRec}%)</span></div><div class="mistake-bar-track"><div class="mistake-bar-fill" id="barRecursion" style="width:${pctRec}%;"></div></div></div><div class="mistake-bar-group"><div class="mistake-bar-label"><span class="category-name">Wrong Logic Patterns</span><span>${wrongLogic} (${pctLogic}%)</span></div><div class="mistake-bar-track"><div class="mistake-bar-fill" id="barWrongLogic" style="width:${pctLogic}%;"></div></div></div></div><div class="socratic-recommendation-box" style="border-left-color:${recBorderColor};border-color:rgba(${total > 0 ? (maxVal === offByOne ? '245,158,11' : maxVal === recursion ? '6,182,212' : '236,72,153') : '249,115,22'},0.2);"><span class="socratic-rec-title" style="color:${recColor};">${recTitle}</span><p class="socratic-rec-text">${recommendation}</p></div><div class="recent-mistakes-section"><span class="recent-mistakes-title">Recent Mistake Traces</span><div class="recent-mistakes-list">${logsHtml}</div></div></div>`;
}

function formatMistakeDate(dateStr) {
  try { const d = new Date(dateStr); const now = new Date(); const diffMs = now - d; const diffMins = Math.floor(diffMs / 60000); if (diffMins < 1) return "Just now"; if (diffMins < 60) return `${diffMins}m ago`; const diffHours = Math.floor(diffMins / 60); if (diffHours < 24) return `${diffHours}h ago`; return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } catch (e) { return "Recently"; }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}


// ============================================
// NEWSLETTER
// ============================================
function initNewsletterValidation() {
  const form = document.getElementById("newsletterForm");
  if (!form) return;
  const input = document.getElementById("newsletterEmail");
  const errorSpan = document.getElementById("newsletterError");
  if (!input || !errorSpan) return;
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const showError = (msg) => { errorSpan.textContent = msg; input.classList.add("input-error"); input.classList.remove("input-success"); input.setAttribute("aria-invalid", "true"); };
  const showSuccess = () => { errorSpan.textContent = ""; input.classList.remove("input-error"); input.classList.add("input-success"); input.removeAttribute("aria-invalid"); };
  const clearState = () => { errorSpan.textContent = ""; input.classList.remove("input-error", "input-success"); input.removeAttribute("aria-invalid"); };
  input.addEventListener("blur", () => { const val = input.value.trim(); if (!val) showError("Email address is required."); else if (!validateEmail(val)) showError("Please enter a valid email address."); else showSuccess(); });
  input.addEventListener("input", clearState);
  form.addEventListener("submit", (e) => { e.preventDefault(); const val = input.value.trim(); if (!val) { showError("Email address is required."); input.focus(); return; } if (!validateEmail(val)) { showError("Please enter a valid email address."); input.focus(); return; } showSuccess(); showNotification("🎉 Successfully subscribed to the newsletter!", "success"); input.value = ""; setTimeout(clearState, 1500); });
}

function initFooterCurrentDate() {
  const yearEl = document.getElementById("footer-current-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  const dateEl = document.getElementById("footer-current-date");
  if (dateEl) dateEl.textContent = `Today: ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}`;
}

// ============================================
// GAME SYSTEM (Truncated - keep existing)
// ============================================
// ... (Game system code - keep as is from your original file)
// The game system is very long, keeping it as is from your original.

// ============================================
// SYNTAX HIGHLIGHTING
// ============================================
function updateSyntaxHighlight() {
  const editor = document.getElementById("codeEditor");
  const highlight = document.getElementById("syntaxHighlight");
  if (!editor || !highlight) return;
  const code = editor.value;
  const lines = code.split("\n");
  const lang = document.getElementById("languageSelect")?.value || "javascript";
  const highlighters = {
    javascript: highlightJS,
    python: highlightPython,
    java: highlightJava,
    cpp: highlightCpp,
    c: highlightC,
    swift: highlightSwift,
  };
  const fn = highlighters[lang] || escapeHtml;
  const highlighted = lines.map(line => fn(line)).join("\n");
  highlight.innerHTML = highlighted + "\n";
}

function highlightJS(line) {
  const kwType = {
    function:'decl',const:'decl',let:'decl',var:'decl',class:'decl',extends:'decl',
    import:'decl',export:'decl',from:'decl',as:'decl',async:'decl',await:'decl',
    yield:'decl',new:'decl',this:'decl',super:'decl',
    return:'flow',if:'flow',else:'flow',for:'flow',while:'flow',do:'flow',
    break:'flow',continue:'flow',switch:'flow',case:'flow',default:'flow',
    try:'flow',catch:'flow',finally:'flow',throw:'flow',typeof:'flow',
    instanceof:'flow',void:'flow',delete:'flow',in:'flow',of:'flow',
    with:'flow',debugger:'flow',
    true:'literal',false:'literal',null:'literal',undefined:'literal',
  };
  const regex = /(<[^>]+>)|(\/\/.*$)|("[^"]*"|'[^']*'|`[^`]*`)|(\b(?:function|const|let|var|return|if|else|for|while|do|break|continue|switch|case|default|try|catch|finally|throw|new|this|class|extends|super|import|export|from|as|async|await|yield|typeof|instanceof|void|delete|in|of|with|debugger|true|false|null|undefined)\b)|((?<!\.[a-zA-Z])\b(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?\b(?!\.[a-zA-Z]))/g;
  let result = escapeHtml(line);
  return result.replace(regex, (m, tag, comment, str, kw, num) => {
    if (tag) return tag;
    if (comment) return '<span class="token comment">' + comment + '</span>';
    if (str) return '<span class="token string">' + str + '</span>';
    if (kw) return '<span class="token keyword keyword-' + (kwType[kw]||'flow') + '">' + kw + '</span>';
    if (num) return '<span class="token number">' + num + '</span>';
    return m;
  });
}

function highlightPython(line) {
  const kwType = {
    class:'decl',def:'decl',lambda:'decl',async:'decl',await:'decl',
    global:'decl',nonlocal:'decl',with:'decl',as:'decl',from:'decl',import:'decl',
    break:'flow',continue:'flow',for:'flow',while:'flow',if:'flow',elif:'flow',
    else:'flow',return:'flow',yield:'flow',raise:'flow',try:'flow',except:'flow',
    finally:'flow',assert:'flow',pass:'flow',del:'flow',in:'flow',is:'flow',
    not:'flow',and:'flow',or:'flow',
    True:'literal',False:'literal',None:'literal',
  };
  const regex = /(#[^]*$)|("[^"]*"|'[^']*')|(\b(?:False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b)|((?<!\.[a-zA-Z])\b(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?\b(?!\.[a-zA-Z]))/g;
  let result = escapeHtml(line);
  return result.replace(regex, (m, comment, str, kw, num) => {
    if (comment) return '<span class="token comment">' + comment + '</span>';
    if (str) return '<span class="token string">' + str + '</span>';
    if (kw) return '<span class="token keyword keyword-' + (kwType[kw]||'flow') + '">' + kw + '</span>';
    if (num) return '<span class="token number">' + num + '</span>';
    return m;
  });
}

function highlightJava(line) {
  const kwType = {
    class:'decl',interface:'decl',enum:'decl',extends:'decl',implements:'decl',
    abstract:'decl',final:'decl',static:'decl',native:'decl',transient:'decl',
    volatile:'decl',synchronized:'decl',strictfp:'decl',package:'decl',
    import:'decl',new:'decl',this:'decl',super:'decl',
    boolean:'type',byte:'type',char:'type',short:'type',int:'type',
    long:'type',float:'type',double:'type',void:'type',
    if:'flow',else:'flow',for:'flow',while:'flow',do:'flow',break:'flow',
    continue:'flow',switch:'flow',case:'flow',default:'flow',return:'flow',
    throw:'flow',throws:'flow',try:'flow',catch:'flow',finally:'flow',
    assert:'flow',instanceof:'flow',goto:'flow',const:'flow',
    public:'flow',private:'flow',protected:'flow',
    true:'literal',false:'literal',null:'literal',
  };
  const regex = /(\/\/.*$|\/\*[\s\S]*?\*\/)|("[^"]*"|'[^']*')|(\b(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|native|new|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|void|volatile|while|true|false|null)\b)|(@\w+)|((?<!\.[a-zA-Z])\b(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?[fFLl]?\b(?!\.[a-zA-Z]))/g;
  let result = escapeHtml(line);
  return result.replace(regex, (m, comment, str, kw, ann, num) => {
    if (comment) return '<span class="token comment">' + comment + '</span>';
    if (str) return '<span class="token string">' + str + '</span>';
    if (kw) return '<span class="token keyword keyword-' + (kwType[kw]||'flow') + '">' + kw + '</span>';
    if (ann) return '<span class="token keyword keyword-decl">' + ann + '</span>';
    if (num) return '<span class="token number">' + num + '</span>';
    return m;
  });
}

function highlightCpp(line) {
  const kwType = {
    class:'decl',struct:'decl',enum:'decl',union:'decl',namespace:'decl',
    using:'decl',template:'decl',typename:'decl',typedef:'decl',new:'decl',
    this:'decl',friend:'decl',virtual:'decl',override:'decl',explicit:'decl',
    mutable:'decl',inline:'decl',constexpr:'decl',decltype:'decl',static:'decl',
    extern:'decl',const:'decl',volatile:'decl',register:'decl',auto:'decl',
    operator:'decl',export:'decl',
    bool:'type',char:'type',int:'type',float:'type',double:'type',
    long:'type',short:'type',signed:'type',unsigned:'type',void:'type',
    if:'flow',else:'flow',for:'flow',while:'flow',do:'flow',break:'flow',
    continue:'flow',switch:'flow',case:'flow',default:'flow',return:'flow',
    throw:'flow',try:'flow',catch:'flow',noexcept:'flow',sizeof:'flow',
    typeid:'flow',static_cast:'flow',dynamic_cast:'flow',reinterpret_cast:'flow',
    const_cast:'flow',static_assert:'flow',goto:'flow',
    public:'flow',private:'flow',protected:'flow',
    true:'literal',false:'literal',nullptr:'literal',
  };
  const regex = /(\/\/.*$|\/\*[\s\S]*?\*\/)|("[^"]*"|'[^']*')|(#.*$)|(\b(?:alignas|alignof|auto|bool|break|case|catch|char|class|const|constexpr|continue|decltype|default|delete|do|double|else|enum|explicit|export|extern|false|float|for|friend|goto|if|include|inline|int|long|mutable|namespace|new|noexcept|nullptr|operator|override|private|protected|public|register|reinterpret_cast|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|throw|true|try|typedef|typeid|typename|union|unsigned|using|virtual|void|volatile|while)\b)|((?<!\.[a-zA-Z])\b(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?[uUlLfF]?\b(?!\.[a-zA-Z]))/g;
  let result = escapeHtml(line);
  return result.replace(regex, (m, comment, str, pre, kw, num) => {
    if (comment) return '<span class="token comment">' + comment + '</span>';
    if (str) return '<span class="token string">' + str + '</span>';
    if (pre) return '<span class="token preprocessor">' + pre + '</span>';
    if (kw) return '<span class="token keyword keyword-' + (kwType[kw]||'flow') + '">' + kw + '</span>';
    if (num) return '<span class="token number">' + num + '</span>';
    return m;
  });
}

function highlightC(line) {
  const kwType = {
    struct:'decl',union:'decl',enum:'decl',typedef:'decl',static:'decl',
    extern:'decl',const:'decl',volatile:'decl',register:'decl',auto:'decl',
    char:'type',int:'type',float:'type',double:'type',long:'type',
    short:'type',signed:'type',unsigned:'type',void:'type',
    if:'flow',else:'flow',for:'flow',while:'flow',do:'flow',break:'flow',
    continue:'flow',switch:'flow',case:'flow',default:'flow',return:'flow',
    sizeof:'flow',goto:'flow',
    NULL:'literal',
  };
  const regex = /(\/\/.*$|\/\*[\s\S]*?\*\/)|("[^"]*"|'[^']*')|(#.*$)|(\b(?:auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|include|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while|NULL)\b)|((?<!\.[a-zA-Z])\b(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?[uUlL]?\b(?!\.[a-zA-Z]))/g;
  let result = escapeHtml(line);
  return result.replace(regex, (m, comment, str, pre, kw, num) => {
    if (comment) return '<span class="token comment">' + comment + '</span>';
    if (str) return '<span class="token string">' + str + '</span>';
    if (pre) return '<span class="token preprocessor">' + pre + '</span>';
    if (kw) return '<span class="token keyword keyword-' + (kwType[kw]||'flow') + '">' + kw + '</span>';
    if (num) return '<span class="token number">' + num + '</span>';
    return m;
  });
}

function highlightSwift(line) {
  const kwType = {
    class:'decl',struct:'decl',enum:'decl',protocol:'decl',extension:'decl',
    func:'decl',init:'decl',deinit:'decl',subscript:'decl',typealias:'decl',
    associatedtype:'decl',let:'decl',var:'decl',import:'decl',operator:'decl',
    open:'decl',public:'decl',internal:'decl',fileprivate:'decl',private:'decl',
    static:'decl',inout:'decl',
    if:'flow',else:'flow',for:'flow',while:'flow',repeat:'flow',switch:'flow',
    case:'flow',default:'flow',break:'flow',continue:'flow',return:'flow',
    throw:'flow',throws:'flow',rethrows:'flow',try:'flow',catch:'flow',
    defer:'flow',guard:'flow',where:'flow',in:'flow',as:'flow',is:'flow',
    fallthrough:'flow',do:'flow',
    true:'literal',false:'literal',nil:'literal',self:'literal',Self:'literal',super:'literal',
  };
  const regex = /(\/\/.*$|\/\*[\s\S]*?\*\/)|("[^"]*"|"""(?:(?!""").)*""")|(\b(?:associatedtype|class|deinit|enum|extension|fileprivate|func|import|init|inout|internal|let|open|operator|private|protocol|public|static|struct|subscript|typealias|var|break|case|continue|default|defer|do|else|fallthrough|for|guard|if|in|repeat|return|switch|where|while|as|catch|false|is|nil|rethrows|super|self|Self|throw|throws|true|try)\b)|((?<!\.[a-zA-Z])\b(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?\b(?!\.[a-zA-Z]))/g;
  let result = escapeHtml(line);
  return result.replace(regex, (m, comment, str, kw, num) => {
    if (comment) return '<span class="token comment">' + comment + '</span>';
    if (str) return '<span class="token string">' + str + '</span>';
    if (kw) return '<span class="token keyword keyword-' + (kwType[kw]||'flow') + '">' + kw + '</span>';
    if (num) return '<span class="token number">' + num + '</span>';
    return m;
  });
}

function updateCurrentLineHighlight() {
  const editor = document.getElementById('codeEditor');
  const indicator = document.getElementById('currentLineIndicator');
  if (!editor || !indicator) return;
  const textBefore = editor.value.substring(0, editor.selectionStart);
  const lineNumber = textBefore.split('\n').length;
  const lineHeight = parseFloat(getComputedStyle(editor).lineHeight) || 22.4;
  const paddingTop = parseFloat(getComputedStyle(editor).paddingTop) || 16;
  const scrollTop = editor.scrollTop;
  indicator.style.top = (paddingTop + (lineNumber - 1) * lineHeight - scrollTop) + 'px';
  indicator.style.height = lineHeight + 'px';
}

// Initialize quiz editor
function wireQuizButtons() {
  const runBtn = document.getElementById('quizRunBtn');
  const submitBtn = document.getElementById('quizSubmitBtn');
  if (runBtn && !runBtn._quizWired) { runBtn.addEventListener('click', runQuizCode); runBtn._quizWired = true; }
  if (submitBtn && !submitBtn._quizWired) { submitBtn.addEventListener('click', submitQuizCode); submitBtn._quizWired = true; }
}

function initializeQuizEditor() {
  const editor = document.getElementById('codeEditor');
  const languageSelect = document.getElementById('languageSelect');
  if (!editor || editor.dataset.initialized === 'true') { wireQuizButtons(); return; }
  editor.dataset.initialized = 'true';
  const syncEditorState = () => { updateSyntaxHighlight(); updateLineNumbers(); syncScroll(); };
  editor.addEventListener('input', () => { syncEditorState(); if (currentProblem) saveEditorDraft(currentProblem.id, editor.value, getProblemSignature(currentProblem)); });
  editor.addEventListener('scroll', syncScroll);
  editor.addEventListener('keyup', updateCurrentLineHighlight);
  editor.addEventListener('click', updateCurrentLineHighlight);
  editor.addEventListener('focus', updateCurrentLineHighlight);
  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') { e.preventDefault(); const start = editor.selectionStart; const end = editor.selectionEnd; const value = editor.value; editor.value = `${value.slice(0, start)}    ${value.slice(end)}`; editor.selectionStart = editor.selectionEnd = start + 4; syncEditorState(); }
    else if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); runQuizCode(); }
    else if (e.ctrlKey && e.key === 's') { e.preventDefault(); submitQuizCode(); }
  });
  wireQuizButtons();
  if (languageSelect) languageSelect.addEventListener('change', () => { const editor = document.getElementById('codeEditor'); if (editor && currentProblem) { editor.value = getDefaultCode(languageSelect.value, currentProblem); editor.scrollTop = 0; editor.scrollLeft = 0; } syncEditorState(); updateEditorDisplayMode(); });
  syncEditorState();
  initEditorZoom(editor);
}

function initEditorZoom(editor) {
  const zoomMin = 10, zoomMax = 28;
  const container = editor.closest('.code-editor-container') || editor.parentElement;
  let fontSize = parseInt(localStorage.getItem('editorFontSize')) || 14;
  const applyZoom = (size) => {
    size = Math.min(zoomMax, Math.max(zoomMin, size));
    fontSize = size;
    container.style.setProperty('--editor-font-size', size + 'px');
    localStorage.setItem('editorFontSize', size);
    if (typeof updateLineNumbers === 'function') updateLineNumbers();
  };
  applyZoom(fontSize);
  editor.addEventListener('wheel', (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    applyZoom(fontSize + (e.deltaY > 0 ? -1 : 1));
  }, { passive: false });
  editor.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === '=' || e.key === '+') { e.preventDefault(); applyZoom(fontSize + 1); }
      else if (e.key === '-') { e.preventDefault(); applyZoom(fontSize - 1); }
      else if (e.key === '0') { e.preventDefault(); applyZoom(14); }
    }
  });
}

if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', initializeQuizEditor);
else initializeQuizEditor();

// ============================================
// HASH CHANGE ROUTER
// ============================================
window.addEventListener('hashchange', () => {
  const currentHash = window.location.hash || '#home';
  if (currentHash === '#home' || currentHash === '') {
    document.querySelectorAll('*').forEach(element => {
      const id = element.id ? element.id.toLowerCase() : '';
      const className = element.className ? element.className.toString().toLowerCase() : '';
      if (id.includes('quiz') || className.includes('quiz') || id.includes('assistant')) {
        element.dataset.routeHidden = 'true';
        element.style.display = 'none';
      } else if (element.dataset.routeHidden === 'true') {
        delete element.dataset.routeHidden;
        element.classList.remove('hidden');
        element.style.display = '';
      }
    });
    if (typeof tQuiz !== 'undefined' && tQuiz !== null) tQuiz = null;
  }
});

// ============================================
// RUN PERL
// ============================================
let isRunning = false;
function initPerlEditor() {
  const codeEl = document.getElementById("perlEditor");
  const outputEl = document.getElementById("perlOutput");
  const runBtn = document.getElementById("runBtn");
  const resetBtn = document.getElementById("resetBtn");
  const sampleBtn = document.getElementById("sampleBtn");
  if (runBtn) runBtn.addEventListener("click", runPerl);
  if (resetBtn) resetBtn.addEventListener("click", () => { if (codeEl) codeEl.value = ""; if (outputEl) outputEl.textContent = "Run code to see output..."; });
  if (sampleBtn) sampleBtn.addEventListener("click", () => { if (codeEl) codeEl.value = `print "Hello World\\n";\n\nmy $name = "DSA Learner";\nprint "Welcome $name\\n";`; });
}

async function runPerl() {
  if (isRunning) return;
  isRunning = true;
  const editor = document.getElementById("perlEditor");
  const output = document.getElementById("perlOutput");
  const code = editor ? editor.value.trim() : "";
  if (!code) { if (output) output.textContent = "❌ No code provided"; isRunning = false; return; }
  if (output) output.textContent = "Running... ⏳";
  try {
    // Route through the standard execution backend (API_BASE) instead of a
    // hardcoded localhost URL, which fails as mixed content on the HTTPS site.
    const result = await executeViaApi("perl", code);
    if (output) output.textContent = result.stdout || "No output";
  } catch (err) { if (output) output.textContent = "Error: " + err.message; }
  isRunning = false;
}


// Inject Report Issue Feature on educational pages
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  if (path.includes('/pages/learning/') || path.includes('/pages/visualizers/') || path.includes('/pages/resources/')) {
    const script = document.createElement('script');
    script.src = '/scripts/report-issue.js';
    document.body.appendChild(script);
  }
});


// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', function(e) {
    // Ctrl+K: Focus search
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.focus();
    }
    
    // Alt+H: Home
    if (e.altKey && e.key === 'h') {
        e.preventDefault();
        window.location.href = '#home';
    }
    
    // Alt+T: Topics
    if (e.altKey && e.key === 't') {
        e.preventDefault();
        window.location.href = '#topics';
    }
    
    // Alt+P: Practice
    if (e.altKey && e.key === 'p') {
        e.preventDefault();
        window.location.href = '#practice';
    }
    
    // Alt+Q: Quiz
    if (e.altKey && e.key === 'q') {
        e.preventDefault();
        window.location.href = '#quiz';
    }
    
    // Alt+D: Dashboard
    if (e.altKey && e.key === 'd') {
        e.preventDefault();
        window.location.href = '#dashboard';
    }
    
    // Escape: Close modal
    if (e.key === 'Escape') {
        closeShortcutModal();
    }
});

// Open shortcut modal
function openShortcutModal() {
    const modal = document.getElementById('shortcutModal');
    if (modal) modal.style.display = 'flex';
}

// Close shortcut modal
function closeShortcutModal() {
    const modal = document.getElementById('shortcutModal');
    if (modal) modal.style.display = 'none';
}

// ===== DID YOU KNOW? FACTS =====
const facts = [
    "The first computer virus, called 'Creeper', was created in 1971",
    "The term 'bug' was coined when a moth got stuck in a computer in 1947",
    "The first algorithm was written over 4,000 years ago by Babylonians",
    "There are over 700 programming languages in use today",
    "The first computer programmer was Ada Lovelace in the 1840s",
    "Google processes over 3.5 billion searches per day",
    "The first website is still online (info.cern.ch)",
    "Python is named after Monty Python, not the snake",
    "The first hard drive weighed over a ton and stored 5MB",
    "JavaScript was created in just 10 days",
    "The first computer mouse was made of wood",
    "The first email was sent in 1971 by Ray Tomlinson",
    "CAPTCHA stands for Completely Automated Public Turing test",
    "The first webcam was used to monitor a coffee pot",
    "There are more than 1.5 billion websites on the internet"
];

function getDailyFact() {
    const today = new Date().toDateString();
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
        hash = ((hash << 5) - hash) + today.charCodeAt(i);
        hash = hash & hash;
    }
    const index = Math.abs(hash) % facts.length;
    return facts[index];
}

function showNextFact() {
    const factText = document.getElementById('factText');
    const factDate = document.getElementById('factDate');
    
    const randomIndex = Math.floor(Math.random() * facts.length);
    factText.textContent = facts[randomIndex];
    factDate.textContent = `💡 Fun fact #${randomIndex + 1}`;
}

function showDailyFact() {
    const factText = document.getElementById('factText');
    const factDate = document.getElementById('factDate');
    
    // Add null checks
    if (!factText || !factDate) {
        console.warn('Daily fact elements not found');
        return;
    }
    
    factText.textContent = getDailyFact();
    const today = new Date().toLocaleDateString();
    factDate.textContent = `📅 Fact of the day • ${today}`;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    showDailyFact();
});

// ==== CODE LANGUAGE BADGES ====
function detectLanguage(code) {
  const patterns = {
        javascript: /function\s*\(|const\s+\w+\s*=|let\s+\w+\s*=|=>|console\.log/,
        python: /def\s+\w+\s*\(|import\s+\w+|print\(|if\s+__name__\s*==/,
        java: /public\s+class|System\.out\.println|public\s+static\s+void\s+main/,
        cpp: /#include\s*<.*>|using\s+namespace\s+std|std::/,
        html: /<!DOCTYPE\s+html|<html|<body|<div\s+class/,
        css: /{[\s\S]*;[\s\S]*}/,
        sql: /SELECT.*FROM|INSERT\s+INTO|UPDATE.*SET|DELETE\s+FROM/,
        php: /<\?php|\$[a-zA-Z_]/,
        ruby: /def\s+\w+|end|puts\s+/,
        go: /package\s+main|func\s+main\(\)|import\s*\(/,
        rust: /fn\s+main\(\)|let\s+mut|println!/
    };

    for(const[lang,pattern] of Object.entries(patterns)) {
      if(pattern.test(code)) return lang;
    }
    return 'text';
    }

    function addLanguageBadges(){
      document.querySelectorAll('pre code').forEach(codcodeBlock => {
        const code = codcodeBlock.textContent;
        const lang = detectLanguage(code);
        const pre = codcodeBlock.closest('pre');
        const container = pre.closest('.code-block')|| pre.parentElement;
        container.style.position='relative';
        container.sty;e.background='#1a1e2f';
        container.style.borderRadius = '8px';
        container.style.overflow = 'hidden';
        

        const badge = document.createElement('span');
        badge.className = `language-badge ${lang}`;
        badge.textContent = lang;
        container.appendChild(badge);
      });
    }
    

// ===== RECENT ACTIVITY FEED =====

// Get activities from localStorage
function getRecentActivity() {
    const activities = JSON.parse(localStorage.getItem('recentActivities') || '[]');
    return activities.slice(0, 10);
}

// Add a new activity
function addActivity(type, text) {
    const activities = JSON.parse(localStorage.getItem('recentActivities') || '[]');
    activities.unshift({
        type: type, // 'solved', 'quiz', 'badge'
        text: text,
        date: new Date().toISOString()
    });
    // Keep only last 50
    if (activities.length > 50) {
        activities.length = 50;
    }
    localStorage.setItem('recentActivities', JSON.stringify(activities));
    renderActivityFeed();
}

// Render activity feed on dashboard
function renderActivityFeed() {
    const container = document.getElementById('recentActivityFeed');
    if (!container) return;

    const activities = getRecentActivity();

    if (activities.length === 0) {
        container.innerHTML = `<p style="color: #6b7280; font-size: 0.9rem;">No recent activity. Start solving problems!</p>`;
        return;
    }

    const icons = {
        solved: '✅',
        quiz: '📝',
        badge: '🏆'
    };

    container.innerHTML = activities.map(activity => `
        <div style="display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <span style="font-size: 1.2rem;">${icons[activity.type] || '📌'}</span>
            <span style="flex: 1; font-size: 0.9rem;">${activity.text}</span>
            <span style="font-size: 0.7rem; color: #6b7280;">${timeAgo(activity.date)}</span>
        </div>
    `).join('');
}

// Time ago helper
function timeAgo(date) {
    const diff = Math.floor((new Date() - new Date(date)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
}

// Call this when user solves a problem
function trackProblemSolved(problemName) {
    addActivity('solved', `Solved ${problemName}`);
}

// Call this when user completes a quiz
function trackQuizCompleted(topic) {
    addActivity('quiz', `Completed ${topic} quiz`);
}

// Call this when user earns a badge
function trackBadgeEarned(badgeName) {
    addActivity('badge', `Earned ${badgeName} badge`);
}

    //Run on page load
    document.addEventListener('DOMContentLoaded' , addLanguageBadges);
    document.addEventListener('DOMContentLoaded' , addLanguageBadges);
// ============================================
// REUSABLE ACCESSIBLE MODAL ARCHITECTURE
// ============================================
(function() {
    function initModalManager() {
        const activeModals = new Set();
        
        function isModalElement(el) {
            if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
            const classes = el.className?.toString().toLowerCase() || "";
            const id = el.id?.toLowerCase() || "";
            return classes.includes('modal') || 
                   id.includes('modal') || 
                   el.getAttribute('role') === 'dialog' || 
                   el.getAttribute('aria-modal') === 'true';
        }
        
        function getFocusableElements(el) {
            return el.querySelectorAll('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]');
        }

        function setupModalAccessibility(modal) {
            if (!modal.getAttribute('role')) {
                modal.setAttribute('role', 'dialog');
            }
            modal.setAttribute('aria-modal', 'true');
            
            const header = modal.querySelector('h2, h3, h4, .modal-title, .quiz-modal-header h3');
            if (header && !modal.getAttribute('aria-labelledby')) {
                if (!header.id) {
                    header.id = 'modal-title-' + Math.random().toString(36).substr(2, 9);
                }
                modal.setAttribute('aria-labelledby', header.id);
            }
        }

        function trapFocus(e, modal) {
            if (e.key !== 'Tab') return;
            const focusable = Array.from(getFocusableElements(modal)).filter(el => el.tabIndex !== -1);
            if (focusable.length === 0) return;
            
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    last.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === last) {
                    first.focus();
                    e.preventDefault();
                }
            }
        }

        function handleModalOpen(modal) {
            if (activeModals.has(modal)) return;
            activeModals.add(modal);
            
            setupModalAccessibility(modal);
            
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
            document.body.classList.add('modal-open');
            
            modal._trapFocusListener = (e) => trapFocus(e, modal);
            modal.addEventListener('keydown', modal._trapFocusListener);
            
            const focusable = getFocusableElements(modal);
            modal._previouslyFocused = document.activeElement;
            if (focusable.length > 0) {
                setTimeout(() => focusable[0].focus(), 50);
            }
            
            if (!modal._overlayCloseBound) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        closeModal(modal);
                    }
                });
                modal._overlayCloseBound = true;
            }
        }

        function handleModalClose(modal) {
            if (!activeModals.has(modal)) return;
            activeModals.delete(modal);
            
            if (modal._trapFocusListener) {
                modal.removeEventListener('keydown', modal._trapFocusListener);
                modal._trapFocusListener = null;
            }
            
            if (modal._previouslyFocused && modal._previouslyFocused.focus) {
                modal._previouslyFocused.focus();
                modal._previouslyFocused = null;
            }
            
            if (activeModals.size === 0) {
                document.body.classList.remove('modal-open');
            }
        }

        function closeModal(modal) {
            if (modal.classList.contains('active')) {
                modal.classList.remove('active');
            } else if (modal.style.display && modal.style.display !== 'none') {
                modal.style.display = 'none';
            } else if (modal.classList.contains('show')) {
                modal.classList.remove('show');
            } else if (!modal.classList.contains('hidden')) {
                modal.classList.add('hidden');
            }
        }

        function checkElement(element) {
            if (!isModalElement(element)) return;
            
            const isVisible = element.classList.contains('active') || 
                              element.classList.contains('show') || 
                              element.style.display === 'flex' || 
                              element.style.display === 'block' ||
                              (element.style.display && element.style.display !== 'none' && !element.classList.contains('hidden')) ||
                              (!element.classList.contains('hidden') && element.classList.contains('active')) ||
                              (element.classList.contains('modal-overlay') && !element.classList.contains('hidden'));
            
            if (isVisible) {
                handleModalOpen(element);
            } else {
                handleModalClose(element);
            }
        }

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes') {
                    checkElement(mutation.target);
                } else if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (isModalElement(node)) {
                                checkElement(node);
                            }
                            node.querySelectorAll && node.querySelectorAll('.modal, .modal-overlay, [class*="modal"]').forEach(checkElement);
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            attributes: true,
            childList: true,
            subtree: true,
            attributeFilter: ['class', 'style']
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                activeModals.forEach(modal => {
                    closeModal(modal);
                });
            }
        });

        document.querySelectorAll('.modal, .modal-overlay, [class*="modal"]').forEach(checkElement);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initModalManager);
    } else {
        initModalManager();
    }
})();

// ============================================
// PROFILE EDITING & LANGUAGES MANAGER
// ============================================
(function() {
    const PROFILE_AVATARS = ["🚀", "💻", "🧠", "🔥", "🦄", "⚡", "🤖", "🎨"];
    let selectedProfileAvatar = "";

    window.openProfileModal = function() {
        const modal = document.getElementById("profileEditModal");
        const nameInput = document.getElementById("profileNameInput");
        
        if (nameInput) nameInput.value = userProgress.name || "Learner";
        selectedProfileAvatar = userProgress.avatar || "🚀";
        
        renderAvatarOptions();
        
        const userLangs = userProgress.languages || [];
        const checkboxes = document.querySelectorAll(".lang-edit-checkbox");
        checkboxes.forEach(cb => {
            cb.checked = userLangs.includes(cb.value);
        });
        
        if (modal) modal.classList.add("active");
    };

    window.closeProfileModal = function() {
        const modal = document.getElementById("profileEditModal");
        if (modal) modal.classList.remove("active");
    };

    window.selectProfileAvatar = function(av) {
        selectedProfileAvatar = av;
        renderAvatarOptions();
    };

    function renderAvatarOptions() {
        const avatarOpts = document.getElementById("avatarOptions");
        if (!avatarOpts) return;
        avatarOpts.innerHTML = PROFILE_AVATARS.map(av => `
            <span class="avatar-option ${selectedProfileAvatar === av ? 'selected' : ''}" 
                  onclick="selectProfileAvatar('${av}')" 
                  style="cursor: pointer; font-size: 2rem; padding: 0.25rem 0.5rem; border-radius: 8px; border: 2px solid ${selectedProfileAvatar === av ? 'var(--primary)' : 'transparent'}; transition: all 0.2s; display: inline-block;">
                ${av}
            </span>
        `).join("");
    }

    window.saveProfileChanges = function() {
        const nameInput = document.getElementById("profileNameInput");
        const nameVal = nameInput ? nameInput.value.trim() : "";
        
        if (!nameVal) {
            alert("Please enter a valid display name.");
            return;
        }
        
        const userLangs = [];
        const checkboxes = document.querySelectorAll(".lang-edit-checkbox");
        checkboxes.forEach(cb => {
            if (cb.checked) userLangs.push(cb.value);
        });
        
        userProgress.name = nameVal;
        userProgress.avatar = selectedProfileAvatar;
        userProgress.languages = userLangs;
        
        if (typeof saveUserData === 'function') {
            saveUserData();
        } else {
            localStorage.setItem("algoInfinityVerse", JSON.stringify(userProgress));
        }
        
        updateProfileViews();
        window.closeProfileModal();
        
        if (typeof showNotification === 'function') {
            showNotification("Profile updated successfully!", "success");
        }
    };

    window.renderLanguageChips = function() {
        if (typeof userProgress === 'undefined') return;
        const userLangs = userProgress.languages || [];
        const containers = [
            document.getElementById("profileLanguagesSection"),
            document.getElementById("profileLanguages")
        ];
        
        const colors = {
            "C++": "#f34b7d",
            "Java": "#b07219",
            "Python": "#3572A5",
            "JavaScript": "#f1e05a",
            "Rust": "#dea584"
        };

        const textColors = {
            "JavaScript": "#000000"
        };
        
        containers.forEach(container => {
            if (!container) return;
            if (userLangs.length === 0) {
                container.innerHTML = `<span style="color: var(--text-secondary); font-size: 0.9rem; font-style: italic;">No languages added yet. Click edit to add!</span>`;
                return;
            }
            
            container.innerHTML = userLangs.map(lang => {
                const bg = colors[lang] || "var(--primary)";
                const color = textColors[lang] || "#ffffff";
                return `
                    <span class="lang-chip" style="
                        display: inline-flex;
                        align-items: center;
                        background: ${bg};
                        color: ${color};
                        font-size: 0.8rem;
                        font-weight: 600;
                        padding: 0.3rem 0.8rem;
                        border-radius: 20px;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    ">${lang}</span>
                `;
            }).join("");
        });
    };

    function updateProfileViews() {
        const profileName = document.getElementById("profileName");
        if (profileName) profileName.textContent = userProgress.name;
        const profileSectionName = document.getElementById("profileSectionName");
        if (profileSectionName) profileSectionName.textContent = userProgress.name;
        
        const userNameEl = document.getElementById("userName");
        if (userNameEl) userNameEl.textContent = userProgress.name;
        const cardUserName = document.getElementById("cardUserName");
        if (cardUserName) cardUserName.textContent = userProgress.name;
        
        document.querySelectorAll(".avatar-icon").forEach(el => el.textContent = userProgress.avatar || "🚀");
        const cardAvatar = document.getElementById("cardAvatar");
        if (cardAvatar) cardAvatar.textContent = userProgress.avatar || "🚀";
        
        if (typeof initIdentityCard === 'function') {
            initIdentityCard();
        }
        
        window.renderLanguageChips();
    }

    function setupProfileListeners() {
        const mainEditBtn = document.getElementById("profileSectionEditBtn");
        if (mainEditBtn) mainEditBtn.onclick = window.openProfileModal;
        const pageEditBtn = document.getElementById("profilePageEditBtn");
        if (pageEditBtn) pageEditBtn.onclick = window.openProfileModal;
        
        const closeCrossBtn = document.getElementById("profileModalClose");
        if (closeCrossBtn) closeCrossBtn.onclick = window.closeProfileModal;
        
        window.renderLanguageChips();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupProfileListeners);
    } else {
        setupProfileListeners();
    }
    
    setTimeout(setupProfileListeners, 200);
})();

// PWA Service Worker Registration & Lifecycle Management
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        
        if (registration.waiting) {
          showUpdateToast(registration.waiting);
        }
        
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateToast(newWorker);
            }
          });
        });
      })
      .catch((error) => {
        console.log('ServiceWorker registration failed: ', error);
      });
      
    navigator.serviceWorker.addEventListener('message', async (event) => {
      if (event.data && event.data.type === 'PROCESS_OFFLINE_QUEUE') {
        if (window.offlineStore && typeof window.offlineStore.syncQueue === 'function') {
          console.log('[App] Processing offline action queue...');
          await window.offlineStore.syncQueue();
        }
      }
    });
    
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(estimate => {
        const usageMB = (estimate.usage / (1024 * 1024)).toFixed(2);
        const quotaMB = (estimate.quota / (1024 * 1024)).toFixed(2);
        const storageEl = document.getElementById('pwa-storage-usage');
        if (storageEl) {
          storageEl.textContent = `Offline Storage: ${usageMB} MB / ${quotaMB} MB`;
        }
      });
    }
  });
}

function showUpdateToast(worker) {
  let toast = document.getElementById('pwa-update-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'pwa-update-toast';
    toast.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: rgba(16, 23, 42, 0.95); border: 1px solid var(--primary); padding: 1rem; border-radius: 8px; color: white; z-index: 10000; display: flex; gap: 1rem; align-items: center; box-shadow: 0 5px 15px rgba(0,0,0,0.5); backdrop-filter: blur(10px);';
    
    const text = document.createElement('span');
    text.textContent = 'A new version is available!';
    
    const btn = document.createElement('button');
    btn.textContent = 'Refresh';
    btn.style.cssText = 'background: var(--primary); color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-weight: 600;';
    btn.onclick = () => {
      worker.postMessage({ type: 'SKIP_WAITING' });
    };
    
    toast.appendChild(text);
    toast.appendChild(btn);
    document.body.appendChild(toast);
  }
}

window.switchQuizTab = function(tabName) {
  const probBtn = document.getElementById("btnQuizTabProblem");
  const notesBtn = document.getElementById("btnQuizTabNotes");
  const probContent = document.getElementById("quizTabProblemContent");
  const notesContent = document.getElementById("quizTabNotesContent");

  if (tabName === "problem") {
    if (probBtn) probBtn.classList.add("active");
    if (notesBtn) notesBtn.classList.remove("active");
    if (probContent) probContent.style.display = "block";
    if (notesContent) notesContent.style.display = "none";
  } else {
    if (probBtn) probBtn.classList.remove("active");
    if (notesBtn) notesBtn.classList.add("active");
    if (probContent) probContent.style.display = "none";
    if (notesContent) notesContent.style.display = "block";
  }
};

window.saveActiveProblemNotes = async function() {
  if (!currentProblem) return;

  const notesVal = document.getElementById("noteText")?.value || "";
  const mnemonicVal = document.getElementById("mnemonicText")?.value || "";
  const pitfallsVal = document.getElementById("pitfallsText")?.value || "";
  const whenToUseVal = document.getElementById("whenToUseText")?.value || "";
  const tagsVal = (document.getElementById("noteTags")?.value || "")
    .split(",")
    .map(t => t.trim())
    .filter(t => t.length > 0);

  const noteSaveStatus = document.getElementById("noteSaveStatus");
  if (noteSaveStatus) noteSaveStatus.textContent = "Saving...";

  const noteData = {
    topicKey: currentProblem.category || "general",
    problemId: currentProblem.id,
    notes: notesVal,
    mnemonics: mnemonicVal,
    pitfalls: pitfallsVal,
    whenToUse: whenToUseVal,
    tags: tagsVal,
    updatedAt: new Date().toISOString()
  };

  if (!userProgress.problemNotes) userProgress.problemNotes = {};
  userProgress.problemNotes[currentProblem.id] = noteData;

  // Save to local storage
  if (typeof saveUserData === "function") saveUserData();
  else localStorage.setItem("algoInfinityVerse", JSON.stringify(userProgress));

  try {
    const res = await fetch(`/api/problem-notes/${currentProblem.id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(noteData)
    });
    const data = await res.json();
    if (data.success) {
      if (noteSaveStatus) {
        noteSaveStatus.textContent = "Saved to cloud!";
        setTimeout(() => { noteSaveStatus.textContent = ""; }, 3000);
      }
    } else {
      if (noteSaveStatus) noteSaveStatus.textContent = "Saved locally.";
    }
  } catch (err) {
    console.warn("Cloud sync failed:", err);
    if (noteSaveStatus) noteSaveStatus.textContent = "Saved locally (offline).";
  }
};

window.syncProblemNotesDown = async function() {
  if (location.protocol === "file:") return;
  try {
    const res = await fetch("/api/problem-notes", { credentials: "include" });
    if (res.status === 200) {
      const data = await res.json();
      if (data.success && data.notes) {
        userProgress.problemNotes = { ...(userProgress.problemNotes || {}), ...data.notes };
        if (typeof saveUserData === "function") saveUserData();
        else localStorage.setItem("algoInfinityVerse", JSON.stringify(userProgress));
      }
    }
  } catch (err) {
    console.warn("Could not sync notes down:", err);
  }
};

window.rateRecallDifficulty = async function(quality) {
  if (!currentProblem) return;
  const problemId = currentProblem.id;

  if (!userProgress.spacedRepetition) userProgress.spacedRepetition = {};
  const existing = userProgress.spacedRepetition[problemId] || { repetitions: 0, easeFactor: 2.5, interval: 0 };

  try {
    const res = await fetch(`/api/spaced-repetition/${problemId}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ existing, quality })
    });
    const data = await res.json();
    if (data.success && data.card) {
      userProgress.spacedRepetition[problemId] = data.card;
      if (quality >= 3) {
        userProgress.reviewStreak = (userProgress.reviewStreak || 0) + 1;
      }
      saveUserData();
      showNotification(`Scheduled! Next review in ${data.card.interval} days 📅`, "success");
    } else {
      showNotification("Could not schedule on cloud. Saved locally.", "info");
    }
  } catch (err) {
    console.warn("Spaced repetition sync failed:", err);
    
    // Client-side fallback computation
    const q = Math.max(0, Math.min(5, Number(quality)));
    let { repetitions = 0, easeFactor = 2.5, interval = 0 } = existing;
    if (q < 3) {
      repetitions = 0;
      interval = 1;
    } else {
      repetitions += 1;
      if (repetitions === 1) interval = 1;
      else if (repetitions === 2) interval = 6;
      else interval = Math.round(interval * easeFactor);
      userProgress.reviewStreak = (userProgress.reviewStreak || 0) + 1;
    }
    easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    userProgress.spacedRepetition[problemId] = {
      problemId,
      repetitions,
      easeFactor: Math.round(easeFactor * 100) / 100,
      interval,
      lastReviewed: new Date().toISOString(),
      nextReviewDate: nextReviewDate.toISOString(),
      lastQuality: q
    };
    saveUserData();
    showNotification(`Next review in ${interval} days 📅`, "success");
  }

  const submittedId = currentProblem.id;
  closeQuizEditor();
  clearEditorDraft(submittedId);
  if (typeof refreshReviewQueue === "function") {
    refreshReviewQueue();
  }
};

window.syncSpacedRepetitionDown = async function() {
  if (location.protocol === "file:") return;
  try {
    const res = await fetch("/api/spaced-repetition", { credentials: "include" });
    if (res.status === 200) {
      const data = await res.json();
      if (data.success && data.cards) {
        userProgress.spacedRepetition = { ...(userProgress.spacedRepetition || {}), ...data.cards };
        if (typeof saveUserData === "function") saveUserData();
        else localStorage.setItem("algoInfinityVerse", JSON.stringify(userProgress));
      }
    }
  } catch (err) {
    console.warn("Could not sync spaced repetition down:", err);
  }
};

let refreshing = false;
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

// Offline/Online status handler
window.addEventListener('load', () => {
  function updateOnlineStatus() {
    const banner = document.getElementById('offline-banner');
    if (banner) {
      if (navigator.onLine) {
        banner.classList.add('hidden');
      } else {
        banner.classList.remove('hidden');
      }
    }
  }
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();

  // Sync notes on load
  if (window.syncProblemNotesDown) {
    window.syncProblemNotesDown();
  }
  
  // Sync spaced repetition on load
  if (window.syncSpacedRepetitionDown) {
    window.syncSpacedRepetitionDown();
  }
});

// ============================================
// PROBLEM FILTERING WITH CORRECT COUNT
// ============================================

/**
 * Get filter from URL hash on page load
 */
const VALID_PROBLEM_FILTERS = new Set(['all', 'easy', 'medium', 'hard', 'favorites']);

function getFilterFromURL() {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const filter = params.get('filter') || 'all';
    return VALID_PROBLEM_FILTERS.has(filter) ? filter : 'all';
}

/**
 * Apply filter on page load from URL
 */
function applyFilterFromURL() {
    const filter = getFilterFromURL();
    if (filter !== 'all') {
        const filterBtn = document.querySelector(`.filter-btn[data-filter="${filter}"]`);
        if (filterBtn) {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            filterBtn.classList.add('active');
        }
    }
    filterProblems();
}

// ============================================
// RENDER PROBLEMS WITH COUNT UPDATE
// ============================================

const originalRenderProblems = window.renderProblems;
if (typeof originalRenderProblems === 'function') {
    window.renderProblems = function(problems) {
        originalRenderProblems.call(this, problems);
    };
}

// ============================================
// COMPLETE FILTER IMPLEMENTATION
// ============================================

// Initialize filter buttons on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize filter buttons
    initFilterButtons();
    
    // Apply filter from URL if any
    applyFilterFromURL();
    
    // Initial render
    filterProblems();
});

/**
 * Initialize filter buttons with event listeners
 */
function initFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach((btn) => {
        btn.addEventListener('click', function() {
            filterButtons.forEach((b) => {
                const isActive = b === this;
                b.classList.toggle('active', isActive);
                b.setAttribute('aria-pressed', String(isActive));
            });
            
            // Reset pagination to page 1
            currentPage = 1;
            
            // Filter and render
            filterProblems();
        });
    });
    
    // Clear filters button
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
            // Reset to 'all'
            filterButtons.forEach((b) => b.classList.remove('active'));
            const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
            if (allBtn) allBtn.classList.add('active');
            
            // Clear search
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = '';
                currentSearch = '';
            }
            
            // Reset and render
            currentPage = 1;
            filterProblems();
        });
    }
}

/**
 * Get selected difficulty from active filter button
 */
function getSelectedDifficulty() {
    const activeFilter = document.querySelector('.filter-btn.active');
    if (activeFilter) {
        return activeFilter.dataset.filter || 'all';
    }
    return 'all';
}

/**
 * Get all problems
 */
function getAllProblems() {
    return practiceProblems || [];
}

/**
 * Filter problems by difficulty
 */
function filterProblemsByDifficulty(difficulty, problems) {
    if (difficulty === 'all') {
        return problems;
    }
    if (difficulty === 'favorites') {
        return problems.filter(p => userProgress.favoriteProblems.includes(p.id));
    }
    return problems.filter(problem => 
        problem.difficulty.toLowerCase() === difficulty.toLowerCase()
    );
}

/**
 * Filter problems with search and difficulty
 */
function filterProblems() {
    const selectedDifficulty = getSelectedDifficulty();
    const allProblems = getAllProblems();
    const searchTerm = currentSearch || '';
    
    // Filter by difficulty
    let filtered = filterProblemsByDifficulty(selectedDifficulty, allProblems);
    
    // Filter by search term
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(problem => 
            problem.title.toLowerCase().includes(term) ||
            problem.tags.some(tag => tag.toLowerCase().includes(term)) ||
            (problem.description && problem.description.toLowerCase().includes(term))
        );
    }
    
    // Update count
    updateProblemCount(filtered);
    
    // Render with pagination
    renderProblemsWithPagination(filtered);
}

/**
 * Render problems with pagination
 */
function renderProblemsWithPagination(filteredProblems) {
    const totalProblems = filteredProblems.length;
    const totalPages = Math.max(1, Math.ceil(totalProblems / PROBLEMS_PER_PAGE));
    
    if (currentPage > totalPages) currentPage = totalPages;
    
    const start = (currentPage - 1) * PROBLEMS_PER_PAGE;
    const end = Math.min(start + PROBLEMS_PER_PAGE, totalProblems);
    const pageProblems = filteredProblems.slice(start, end);
    
    // Render the problems
    renderProblems(pageProblems);
    
    // Update pagination
    updatePaginationControls(currentPage, totalPages);
}

/**
 * Update problem count display
 */
function updateProblemCount(filteredProblems) {
    const total = filteredProblems.length;
    const visibleCountEl = document.getElementById('visible-count');
    const totalCountEl = document.getElementById('total-count');
    const problemLabel = document.getElementById('problem-label');
    const emptyState = document.getElementById('emptyState');
    
    if (visibleCountEl) {
        visibleCountEl.textContent = total;
    }
    
    if (totalCountEl) {
        const allProblems = getAllProblems();
        totalCountEl.textContent = allProblems.length;
    }
    
    if (problemLabel) {
        problemLabel.textContent = total === 1 ? 'problem' : 'problems';
    }
    
    if (emptyState) {
        emptyState.classList.toggle('hidden', total !== 0);
    }
    
    // Legacy support
    const countElement = document.querySelector('.problem-count');
    if (countElement) {
        countElement.textContent = `${total} problem${total !== 1 ? 's' : ''}`;
    }
}
