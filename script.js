// ============================================
// ABORT MANAGER
// ============================================
/**
 * Manages AbortControllers to allow cancellation of ongoing requests.
 */
class AbortManager {
  constructor() {
    this.controllers = new Map();
  }
  /**
   * Retrieves an AbortSignal for the given key, cancelling any previous request with the same key.
   *
   * @param {string} key - The unique identifier for the request.
   * @returns {AbortSignal} The signal to pass to the fetch API.
   */
  getSignal(key) {
    if (this.controllers.has(key)) {
      this.controllers.get(key).abort();
    }
    const controller = new AbortController();
    this.controllers.set(key, controller);
    return controller.signal;
  }
  /**
   * Removes the AbortController associated with the given key.
   *
   * @param {string} key - The unique identifier for the request.
   */
  clearSignal(key) {
    this.controllers.delete(key);
  }
}

const apiAbort = new AbortManager();

// ============================================
// CACHE MANAGER (IndexedDB)
// ============================================
/**
 * Manages caching of API responses and partials using IndexedDB.
 */
class CacheManager {
  constructor(dbName = 'AlgoInfinityCache', storeName = 'api_responses') {
    this.dbName = dbName;
    this.storeName = storeName;
    this.dbPromise = this.initDB();
  }

  /**
   * Initializes the IndexedDB database.
   *
   * @returns {Promise<IDBDatabase>} The initialized database instance.
   */
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

  /**
   * Stores data in the cache.
   *
   * @param {string} url - The URL key for the cached data.
   * @param {any} data - The data to cache.
   * @param {string} [type='json'] - The type of data being cached ('json' or 'text').
   * @param {number} [ttlMs=3600000] - Time to live in milliseconds.
   * @returns {Promise<void>}
   */
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
      void 0;
    }
  }

  /**
   * Retrieves data from the cache.
   *
   * @param {string} url - The URL key for the cached data.
   * @returns {Promise<Object|null>} The cached record, or null if not found or expired.
   */
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
      void 0;
      return null;
    }
  }

  /**
   * Invalidates a specific cache entry.
   *
   * @param {string} url - The URL key to invalidate.
   * @returns {Promise<void>}
   */
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
      void 0;
    }
  }

  /**
   * Fetches data from a URL, utilizing the cache if available and not expired.
   *
   * @param {string} url - The URL to fetch.
   * @param {Object} [options={}] - Fetch options (e.g., method, headers, signal).
   * @param {number} [ttlMs=3600000] - Time to live in milliseconds for the cache.
   * @param {string} [type='json'] - The expected response type ('json' or 'text').
   * @returns {Promise<any>} The fetched or cached data.
   */
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
        void 0;
        if (cached) return cached.data;
        throw e;
      }
    };

    if (cached) {
      const age = Date.now() - cached.updatedAt;
      if (age > ttlMs / 2) {
        doFetch().catch(e => {
          if (e.name !== 'AbortError') void 0;
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
/**
 * Retrieves the base path for partial HTML files.
 *
 * @returns {string} The base path for partials.
 */
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

/**
 * Asynchronously loads a partial HTML file and injects it into a target element.
 *
 * @param {string} id - The ID of the target DOM element.
 * @param {string} url - The relative URL of the partial to load.
 * @returns {Promise<void>}
 */
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
      void 0;
    }
  } finally {
    apiAbort.clearSignal(abortKey);
  }
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
// Use window.userProgress set by modules/userProgress.js (single source of truth)
let userProgress = window.userProgress;

// Spaced repetition intervals defined in data/revision-intervals.js
// ============================================
// QUIZ EDITOR STATE
// ============================================
let currentProblem = null;

// ==========================================
// APP INITIALIZATION — handled by modules/init.js
// (which listens for 'partialsLoaded' event)
// ==========================================

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
// ============================================
// NAVBAR
// ============================================
let scrollPosition = 0;
let navbarInitialized = false;
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
// ============================================
// LEADERBOARD
// ============================================
let leaderboardRequestId = 0;
const LEADERBOARD_LIMIT = 10;
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
let cachedSession = null;
let progressSyncTimer = null;
async function syncUserProgress() {
  const session = await getAuthenticatedSession();
  if (!session?.authenticated) return;
  
  const payload = { 
    name: userProgress.name, 
    xp: userProgress.xp, 
    level: userProgress.level, 
    avatar: userProgress.avatar, 
    activityData: userProgress.activityData 
  };

  if (!navigator.onLine) {
    // Queue offline sync
    let queue = JSON.parse(localStorage.getItem('offlineSyncQueue') || '[]');
    queue.push(payload);
    localStorage.setItem('offlineSyncQueue', JSON.stringify(queue));
    
    // Register background sync if supported
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready
        .then(reg => reg.sync.register('sync-offline-actions'))
        .catch(console.error);
    }
    return;
  }

  try {
    await fetch("/api/progress", { 
      credentials: "include", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify(payload) 
    });
    updateLeaderboard();
  } catch (e) { void 0; }
}

async function getAuthenticatedSession() {
  if (window.algoAuth) { cachedSession = window.algoAuth; return cachedSession; }
  if (cachedSession) return cachedSession;
  try { const response = await fetch("/api/session", { credentials: "include" }); cachedSession = response.ok ? await response.json() : { authenticated: false, user: null }; }
  catch { cachedSession = { authenticated: false, user: null }; }
  return cachedSession;
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
      if (el) {
        const pre = document.createElement("pre");
        pre.style.color = "var(--accent)";
        pre.style.marginTop = "10px";
        pre.textContent = metricText;
        el.appendChild(pre);
      }
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
      if (window.spacedRepetition) {
        window.spacedRepetition.scheduleReview(problem.id, problem.topic || 'Practice', problem.difficulty || 'Medium', true, 30);
      }
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
      if (window.spacedRepetition) {
        window.spacedRepetition.scheduleReview(problem.id, problem.topic || 'Practice', problem.difficulty || 'Medium', false, 30);
      }
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
window.addEventListener("resize", () => {
  if (typeof updateLineNumbers === 'function') updateLineNumbers();
  if (typeof syncScroll === 'function') syncScroll();
});
// ============================================
// CODING PERSONALITY
// ============================================
const QUIZ_QUESTIONS = [
  { q: "When starting a new coding problem, what do you do first?", options: [{ text: "Start typing the code immediately to see if it works.", type: "brute-force first" }, { text: "Analyze constraints, define edge cases, and write pseudocode.", type: "slow but accurate" }, { text: "Design a fast greedy heuristic to get a quick correct result.", type: "greedy thinker" }, { text: "Search for hash tables or auxiliary space shortcuts to minimize complexity.", type: "over-optimizer" }] },
  { q: "How do you evaluate time/space complexity?", options: [{ text: "I don't think about it until it gets a Time Limit Exceeded (TLE) error.", type: "brute-force first" }, { text: "I trace the iterations and count nested variables step-by-step.", type: "slow but accurate" }, { text: "I trust locally optimal choices to run fast enough.", type: "greedy thinker" }, { text: "I always structure for O(N) or O(1) space, even if it requires complex code.", type: "over-optimizer" }] },
  { q: "Your solution fails on an empty input. What is your reaction?", options: [{ text: "I patch it with a quick 'if empty return' condition.", type: "brute-force first" }, { text: "I dry-run the loop bounds on paper to understand why it cracked.", type: "slow but accurate" }, { text: "I use simple helper fallback returns.", type: "greedy thinker" }, { text: "I rewrite the index math to prevent empty pointer states altogether.", type: "over-optimizer" }] },
  { q: "What is your main goal when coding?", options: [{ text: "Get green checkmarks as fast as possible.", type: "brute-force first" }, { text: "Write bug-free, clean, and highly readable code.", type: "slow but accurate" }, { text: "Find the simplest, most intuitive logical shortcut.", type: "greedy thinker" }, { text: "Optimize space-time metrics to beat 100% of submissions.", type: "over-optimizer" }] }
];
let currentQuizIndex = 0;
let quizSelections = [];
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
    import('/scripts/report-issue.js').catch(err => console.error('Failed to dynamically import report issue script:', err));
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
// Did You Know facts handled by modules/did-you-know.js
// Language badges handled by modules/language-detect.js
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
            void 0;
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
        void 0;
        
        if (registration.waiting) {
          showUpdateToast(registration.waiting);
        }
        
        const recBadge = isRec ? `<span class="rec-personality-badge"><i class="fas fa-brain"></i> ${recLabel}</span>` : "";

        return `
          <div class="problem-card animate-in" data-id="${problem.id}">
              <div class="problem-header">
                <h3 class="problem-title">${recBadge}${problem.title}</h3>
                 <div class="problem-actions">
                 <button class="favorite-btn ${
                   //here we check if the problem is in the user's favorites and add the 'active' class to the button if it is
                   userProgress.favoriteProblems.includes(problem.id)
                     ? "active"
                     : ""
                 }"
  data-id="${problem.id}" aria-label="Favorite problem">
          <i class="fas fa-heart"></i>
      </button>
                 <button class="notes-btn ${
        userProgress.problemNotes[problem.id] ? "has-notes" : ""
      }" data-id="${problem.id}" aria-label="Problem notes">
    <i class="fas fa-sticky-note"></i>
  </button>
  
  
                   <span class="difficulty-badge ${getDifficultyClass(problem.difficulty)}">${problem.difficulty}</span>
               </div>
              </div>
              <div class="problem-tags">
                  ${problem.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
              </div>
              <div class="problem-meta">
                  <span class="acceptance-rate">
                      <i class="fas fa-users"></i> ${problem.acceptance} acceptance
                  </span>
                  ${
                    userProgress.completedProblems.includes(problem.id)
                      ? '<span class="completed-badge"><i class="fas fa-check"></i> Completed</span>'
                      : ""
                  }
              </div>
          </div>
      `;
    })
    .join("");

  // Favorite button handlers
  problemsGrid.querySelectorAll(".favorite-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();

      const problemId = parseInt(btn.dataset.id);

      toggleFavorite(problemId);

      renderProblems(filter, searchQuery);
    });
  });

  // Notes button handlers
  problemsGrid.querySelectorAll(".notes-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const problemId = parseInt(btn.dataset.id);
      currentNotesProblemId = problemId;
      openNotesModal(problemId);
    });
  });

  // Add click handlers
  problemsGrid.querySelectorAll(".problem-card").forEach((card) => {
    card.addEventListener("click", () => {
      const problemId = parseInt(card.dataset.id);
      handleProblemClick(problemId);
    });
  });
}

function toggleFavorite(problemId) {
  const favorites = userProgress.favoriteProblems;

  if (favorites.includes(problemId)) {
    userProgress.favoriteProblems = favorites.filter((id) => id !== problemId);

    showNotification("Removed from favorites 💔", "info");
  } else {
    userProgress.favoriteProblems.push(problemId);

    showNotification("Added to favorites ❤️", "success");
  }

  saveUserData();
}

function openNotesModal(problemId) {
  currentNotesProblemId = problemId;

  const modal = document.getElementById("notesModal");
  const textarea = document.getElementById("problemNotesInput");

  textarea.value = userProgress.problemNotes[problemId] || "";

  modal.classList.add("active");
}

function closeNotesModal() {
  const modal = document.getElementById("notesModal");

  modal.classList.remove("active");
}

function saveProblemNotes() {
  const textarea = document.getElementById("problemNotesInput");

  const note = textarea.value.trim();

  if (currentNotesProblemId !== null) {
    userProgress.problemNotes[currentNotesProblemId] = note;

    saveUserData();

    showNotification("Notes saved successfully 📝", "success");
  }

  closeNotesModal();
}

// ===== ROADMAP =====
const roadmapSteps = [
  {
    id: 1,
    title: "Complexity Analysis & Big O",
    icon: "fa-stopwatch",
    desc: "Master variables, loops, conditionals, and learn how to analyze algorithm efficiency using Big-O notation.",
    theory: `
      <p><strong>Introduction to Algorithm Analysis:</strong> Before writing code, you must understand how to measure its efficiency. Complexity analysis allows you to evaluate how an algorithm scales as the input size grows.</p>
      <p><strong>Big-O Notation:</strong> Big-O ($O(f(n))$) describes the upper bound of execution time or memory space in the worst-case scenario. It focuses on the dominant term and discards constants.</p>
      <p><strong>Common Time Complexities:</strong></p>
      <ul>
        <li><strong>O(1) - Constant:</strong> Operation takes the same amount of time regardless of input size (e.g., accessing an element in an array by index, push/pop on a stack).</li>
        <li><strong>O(log N) - Logarithmic:</strong> The problem size is divided in half at each step (e.g., Binary Search).</li>
        <li><strong>O(N) - Linear:</strong> Time increases proportionally with input size (e.g., traversing an array or linked list, linear search).</li>
        <li><strong>O(N log N) - Linearithmic:</strong> Efficient sorting algorithms (e.g., Merge Sort, Quick Sort).</li>
        <li><strong>O(N²) - Quadratic:</strong> Nested loops over the input (e.g., Bubble Sort, Insertion Sort).</li>
      </ul>
      <p><strong>Space Complexity:</strong> The amount of memory an algorithm needs relative to the input size. Creating a new array of size N requires O(N) space, while modifying a structure in-place requires O(1) space.</p>
    `,
    type: "quiz",
    quiz: [
      {
        question: "What is the time complexity of searching for an element in an unsorted array of size N?",
        options: ["O(1)", "O(log N)", "O(N)", "O(N^2)"],
        correct: 2,
        explanation: "In an unsorted array, you may need to scan every element in the worst case, taking O(N) time."
      },
      {
        question: "If an algorithm divides the problem size in half at each step (e.g., Binary Search), what is its time complexity?",
        options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
        correct: 1,
        explanation: "Dividing the problem size in half repeatedly yields a logarithmic complexity of O(log N)."
      },
      {
        question: "What is the space complexity of an algorithm that creates a new array of size N to store intermediate values?",
        options: ["O(1)", "O(log N)", "O(N)", "O(N^2)"],
        correct: 2,
        explanation: "Creating a new structure that grows linearly with the input size N requires O(N) auxiliary space."
      }
    ],
    complexity: [
      { op: "Array Access (by index)", time: "O(1)", space: "O(1)" },
      { op: "Linear Search", time: "O(N)", space: "O(1)" },
      { op: "Binary Search", time: "O(log N)", space: "O(1)" },
      { op: "Nested Loops (i, j to N)", time: "O(N^2)", space: "O(1)" }
    ]
  },
  {
    id: 2,
    title: "Arrays & Array Manipulation",
    icon: "fa-chart-simple",
    desc: "Understand contiguous memory, indexing, array traversal, and two-pointer techniques.",
    theory: `
      <p><strong>What is an Array?</strong> An array is a collection of elements stored in contiguous memory locations. Because memory is contiguous, we can access any element in O(1) time if we know its index.</p>
      <p><strong>Common Array Operations:</strong></p>
      <ul>
        <li><strong>Access:</strong> O(1) (direct lookup using index).</li>
        <li><strong>Search:</strong> O(N) (checking each element in a linear scan).</li>
        <li><strong>Insertion / Deletion:</strong> O(N) in the worst case (shifting elements to insert at the beginning or middle).</li>
      </ul>
      <p><strong>Two-Pointers Technique:</strong> A highly popular optimization pattern where two pointers traverse the array from different positions (often left and right, or slow and fast) to solve search/pair problems in linear time.</p>
    `,
    type: "coding",
    problems: [21, 17, 1], // Check If Array Is Sorted, Move Zeroes, Two Sum
    complexity: [
      { op: "Access element by index", time: "O(1)", space: "O(1)" },
      { op: "Insert/Delete at start", time: "O(N)", space: "O(1)" },
      { op: "Search element (linear)", time: "O(N)", space: "O(1)" },
      { op: "Two-pointer search", time: "O(N)", space: "O(1)" }
    ]
  },
  {
    id: 3,
    title: "Strings & Pattern Matching",
    icon: "fa-font",
    desc: "Learn character encoding, string reversal, anagrams, and sliding window basics.",
    theory: `
      <p><strong>What is a String?</strong> In computer science, a string is a sequence of characters. In many languages, strings are immutable (cannot be changed in-place), meaning operations like concatenation create a new string, taking O(N) time and space.</p>
      <p><strong>Key String Concepts:</strong></p>
      <ul>
        <li><strong>Palindromes:</strong> Strings that read the same backwards (e.g., 'madam'). Often checked using two pointers.</li>
        <li><strong>Anagrams:</strong> Rearrangement of characters to form another word (e.g., 'listen' and 'silent'). Checked by counting character frequencies (hash maps/frequency arrays).</li>
        <li><strong>Substring vs Subsequence:</strong> A substring is contiguous; a subsequence is non-contiguous but maintains order.</li>
      </ul>
    `,
    type: "coding",
    problems: [18, 2], // Valid Anagram, Valid Parentheses
    complexity: [
      { op: "Read character by index", time: "O(1)", space: "O(1)" },
      { op: "String concatenation", time: "O(N + M)", space: "O(N + M)" },
      { op: "Anagram check (Hash Map)", time: "O(N)", space: "O(k) where k <= 256" },
      { op: "Substring search (brute-force)", time: "O(N * M)", space: "O(1)" }
    ]
  },
  {
    id: 4,
    title: "Recursion Fundamentals",
    icon: "fa-rotate",
    desc: "Master the call stack, base cases, and solving problems recursively.",
    theory: `
      <p><strong>What is Recursion?</strong> Recursion is a programming technique where a function calls itself directly or indirectly to solve a problem. It works by breaking a problem down into smaller, similar subproblems.</p>
      <p><strong>The Two Golden Rules of Recursion:</strong></p>
      <ol>
        <li><strong>Base Case:</strong> The termination condition that stops the recursion. Without it, you get infinite recursion, causing a stack overflow.</li>
        <li><strong>Recursive Step:</strong> The logic that progresses towards the base case by calling the function with smaller arguments.</li>
      </ol>
      <p><strong>The Call Stack:</strong> Each recursive call pushes a new frame onto the stack. Space complexity is determined by the maximum depth of recursion (O(depth)).</p>
    `,
    type: "quiz",
    quiz: [
      {
        question: "What is the purpose of the 'base case' in a recursive function?",
        options: [
          "To trigger the recursive call",
          "To provide a terminating condition that stops recursion",
          "To optimize the loop runtime",
          "To clear call stack memory"
        ],
        correct: 1,
        explanation: "The base case is crucial to stop the recursive cycle and prevent infinite execution."
      },
      {
        question: "What happens if a recursive function never reaches its base case?",
        options: [
          "It returns undefined immediately",
          "It converts into a fast iterative loop",
          "It crashes with a stack overflow error",
          "It completes in constant space O(1)"
        ],
        correct: 2,
        explanation: "Infinite recursion adds frames to the call stack until it exceeds its limit, throwing a stack overflow error."
      },
      {
        question: "Which data structure is internally used by the execution environment to track recursive calls?",
        options: ["Queue", "Stack", "Heap", "Tree"],
        correct: 1,
        explanation: "The LIFO (Last-In, First-Out) Call Stack manages recursion contexts."
      }
    ],
    complexity: [
      { op: "Factorial/Fibonacci depth", time: "O(N) or O(2^N)", space: "O(N) (call stack)" },
      { op: "Binary search recursive", time: "O(log N)", space: "O(log N) (call stack)" }
    ]
  },
  {
    id: 5,
    title: "Linked Lists (Singly & Doubly)",
    icon: "fa-link",
    desc: "Build dynamic structures, manipulate node pointers, and detect cycles.",
    theory: `
      <p><strong>What is a Linked List?</strong> Unlike arrays, linked lists do not store elements in contiguous memory. Instead, each element (node) contains its value and a pointer (reference) to the next node.</p>
      <p><strong>Why use Linked Lists?</strong> They allow O(1) time insertions and deletions at any point if you already have a reference to that node, and their size can grow dynamically without reallocation overhead.</p>
      <p><strong>Key Operations:</strong></p>
      <ul>
        <li><strong>Access / Search:</strong> O(N) (must traverse from head node step-by-step).</li>
        <li><strong>Insertion / Deletion:</strong> O(1) (just update next pointers, no shifting required).</li>
      </ul>
    `,
    type: "coding",
    problems: [10, 3], // Reverse Linked List, Merge Two Sorted Lists
    complexity: [
      { op: "Access / Search item", time: "O(N)", space: "O(1)" },
      { op: "Insert at head / tail", time: "O(1)", space: "O(1)" },
      { op: "Delete head node", time: "O(1)", space: "O(1)" },
      { op: "Reverse a Linked List", time: "O(N)", space: "O(1)" }
    ]
  },
  {
    id: 6,
    title: "Introduction to Trees",
    icon: "fa-tree",
    desc: "Dive into hierarchical data, binary tree structures, and traversal methods (DFS/BFS).",
    theory: `
      <p><strong>What is a Tree?</strong> A tree is a hierarchical data structure containing nodes connected by edges. A node can have children but has exactly one parent (except the root node).</p>
      <p><strong>Binary Tree:</strong> A tree where each node has at most two children (referred to as left child and right child).</p>
      <p><strong>Binary Search Tree (BST):</strong> A binary tree with a key ordering property: for any node, all values in its left subtree are less, and all values in its right subtree are greater.</p>
      <p><strong>Tree Traversals:</strong></p>
      <ul>
        <li><strong>Depth-First Search (DFS):</strong> Preorder (Root-Left-Right), Inorder (Left-Root-Right - prints BST in sorted order!), Postorder (Left-Right-Root).</li>
        <li><strong>Breadth-First Search (BFS):</strong> Level-by-level traversal using a queue.</li>
      </ul>
    `,
    type: "coding",
    problems: [11, 12], // Invert Binary Tree, Validate BST
    complexity: [
      { op: "Search in balanced BST", time: "O(log N)", space: "O(log N) (stack)" },
      { op: "Search in skewed BST", time: "O(N)", space: "O(N) (stack)" },
      { op: "Invert Binary Tree", time: "O(N)", space: "O(H) where H is height" },
      { op: "Inorder traversal", time: "O(N)", space: "O(H)" }
    ]
  }
];

const advancedRoadmapSteps = [
  {
    id: 7,
    title: "Advanced Arrays & Optimization",
    icon: "fa-bolt",
    desc: "Master complex array manipulations, sliding window, and two-pointer techniques for hard-level interview problems.",
    theory: `
      <p><strong>Advanced Array Optimization:</strong> Many high-level technical interview questions require optimizing array operations from $O(N^2)$ to $O(N)$ or $O(N \log N)$ using advanced pointer movements or auxiliary data structures.</p>
      <p><strong>Sliding Window:</strong> Used to track contiguous subarrays or substrings that satisfy specific conditions. The window can be fixed-size or dynamic (grows/shrinks based on elements).</p>
      <p><strong>Trapping Rain Water Pattern:</strong> An elegant application of the two-pointer technique or prefix/suffix maximum arrays to solve complex optimization problems in $O(N)$ time and $O(1)$ space.</p>
      <p><strong>Design & Cache Optimizations:</strong> Designing high-performance systems like an LRU Cache requires combining a Hash Map (for $O(1)$ lookup) with a Doubly Linked List (for $O(1)$ updates and ordering).</p>
    `,
    type: "coding",
    problems: [9, 5], // Trapping Rain Water, LRU Cache
    complexity: [
      { op: "Trapping Rain Water (Two Pointers)", time: "O(N)", space: "O(1)" },
      { op: "LRU Cache Get / Put Operations", time: "O(1)", space: "O(Capacity)" },
      { op: "Sliding Window (Dynamic)", time: "O(N)", space: "O(N) (worst-case)" }
    ]
  },
  {
    id: 8,
    title: "Advanced Dynamic Programming",
    icon: "fa-layer-group",
    desc: "Learn advanced DP optimizations, multi-dimensional DP, and sequence matching techniques.",
    theory: `
      <p><strong>Advanced DP Concepts:</strong> Beyond basic Fibonacci recursion, advanced dynamic programming involves identifying states with multiple dimensions, managing complex state transition diagrams, and optimizing space.</p>
      <p><strong>Longest Increasing Subsequence (LIS):</strong> A classic DP problem. While a naive DP approach takes $O(N^2)$ time, we can optimize it to $O(N \log N)$ by combining dynamic programming with Binary Search (Patience Sorting).</p>
      <p><strong>Space Optimization:</strong> If the current state only depends on the last few states (e.g., $dp[i]$ depends only on $dp[i-1]$ and $dp[i-2]$ like in the House Robber problem), we can discard the DP array and use just a few variables, reducing space complexity from $O(N)$ to $O(1)$.</p>
    `,
    type: "coding",
    problems: [7, 14], // Longest Increasing Subsequence, House Robber
    complexity: [
      { op: "LIS (Naive Dynamic Programming)", time: "O(N^2)", space: "O(N)" },
      { op: "LIS (DP + Binary Search)", time: "O(N log N)", space: "O(N)" },
      { op: "House Robber (Tabulation)", time: "O(N)", space: "O(N)" },
      { op: "House Robber (Space Optimized)", time: "O(N)", space: "O(1)" }
    ]
  },
  {
    id: 9,
    title: "Advanced Graph Algorithms",
    icon: "fa-circle-nodes",
    desc: "Solve complex graph problems using shortest path, cycle detection, topological sorting, and BFS/DFS.",
    theory: `
      <p><strong>Advanced Graphs:</strong> Graphs model complex relationships. Real-world interview problems often require advanced graph traversal strategies, state tracking, and building custom state representations.</p>
      <p><strong>Topological Sort:</strong> Ordering of vertices in a Directed Acyclic Graph (DAG) such that for every directed edge $uv$, vertex $u$ comes before $v$. Used in dependency resolution (e.g., Course Schedule).</p>
      <p><strong>Word Ladder (BFS State Space Search):</strong> BFS is used to find the shortest path in unweighted graphs. When finding word transitions, each intermediate word represents a state in the state space.</p>
      <p><strong>Grid DFS/BFS (Flood Fill):</strong> Traversing matrix structures (like in Number of Islands) to explore connected components and mark visited coordinates.</p>
    `,
    type: "coding",
    problems: [8, 13, 15], // Word Ladder, Number of Islands, Course Schedule
    complexity: [
      { op: "BFS Shortest Path (Word Ladder)", time: "O(M^2 * N)", space: "O(M^2 * N) where M is word length" },
      { op: "DFS Island Counting (Grid Traversal)", time: "O(R * C)", space: "O(R * C) for stack depth" },
      { op: "Topological Sort (Kahn's / DFS)", time: "O(V + E)", space: "O(V + E)" }
    ]
  },
  {
    id: 10,
    title: "Advanced Optimization & Interview Strategies",
    icon: "fa-crown",
    desc: "Master interview-level optimization techniques, bit manipulation, and competitive programming tips.",
    theory: `
      <p><strong>Final Interview Strategies:</strong> At the advanced level, interviewers look for optimal time/space balances, bitwise optimizations, and clean structuring of backtracking / pruning.</p>
      <p><strong>Bit Manipulation:</strong> Using bitwise operations (AND, OR, XOR, NOT, Shifts) to solve problems in $O(1)$ space and extremely fast execution. XOR is especially useful for finding single occurrences or differences.</p>
      <p><strong>Backtracking Pruning:</strong> Optimizing exhaustive searches by cutting off recursive paths early when we know they cannot yield a valid solution.</p>
    `,
    type: "quiz",
    quiz: [
      {
        question: "Which technique is most appropriate for finding the shortest path in an unweighted graph?",
        options: [
          "Depth-First Search (DFS)",
          "Breadth-First Search (BFS)",
          "Dijkstra's Algorithm",
          "Kruskal's Algorithm"
        ],
        correct: 1,
        explanation: "BFS explores layer by layer and is guaranteed to find the shortest path in terms of number of edges for an unweighted graph."
      },
      {
        question: "What is the optimal time complexity of the Longest Increasing Subsequence (LIS) problem?",
        options: [
          "O(N^2)",
          "O(N log N)",
          "O(N)",
          "O(2^N)"
        ],
        correct: 1,
        explanation: "LIS can be solved in O(N log N) time complexity using dynamic programming with binary search."
      },
      {
        question: "How can we optimize the space complexity of the House Robber problem from O(N) to O(1)?",
        options: [
          "By using a binary search tree",
          "By only keeping track of the last two calculated max values",
          "By using a hash map",
          "It is not possible to achieve O(1) space"
        ],
        correct: 1,
        explanation: "Since each state only depends on the previous two states, we only need two variables to store the intermediate results, reducing space complexity to O(1)."
      }
    ],
    complexity: [
      { op: "Bitwise Operations", time: "O(1)", space: "O(1)" },
      { op: "Pruned Backtracking Search", time: "O(Branch^Depth)", space: "O(Depth)" }
    ]
  }
];

let roadmapTabsInitialized = false;
let currentQuizAnswers = {};

function initRoadmap() {
  // 1. Initialize tabs & modal close events (only once)
  if (!roadmapTabsInitialized) {
    const basicTab = document.getElementById("roadmapBasicTab");
    const advancedTab = document.getElementById("roadmapAdvancedTab");
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
    const closeBtn = document.getElementById("roadmapStepModalClose");
    const closeBtn2 = document.getElementById("roadmapStepModalCloseBtn");
    const modal = document.getElementById("roadmapStepModal");
    
    if (closeBtn) {
      closeBtn.addEventListener("click", () => modal.classList.remove("active"));
    }
    if (closeBtn2) {
      closeBtn2.addEventListener("click", () => modal.classList.remove("active"));
    }
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.remove("active");
      });
    }

    roadmapTabsInitialized = true;
  }

  // 2. Render basic and advanced roadmaps
  renderBasicRoadmap();
  renderAdvancedRoadmap();

  // 3. Render original stages overview
  const progressBar = document.getElementById("roadmapProgress");
  const stages = document.querySelectorAll(".stage");
  if (progressBar && stages.length >= 3) {
    const totalProblems = practiceProblems.length;
    const completed = userProgress.completedProblems.length;
    const progress = Math.min((completed / totalProblems) * 100, 100);
    setTimeout(() => {
      progressBar.style.width = `${progress}%`;

      // Activate stages based on progress
      if (progress >= 25) stages[0].classList.add("active");
      if (progress >= 70) stages[1].classList.add("active");
      if (progress === 100) stages[2].classList.add("active");
    }, 500);
  }
}

function isRoadmapStepCompleted(step) {
  if (step.type === "quiz") {
    return userProgress.completedRoadmapSteps.includes(step.id);
  }
  // For coding steps, check if at least one problem is completed
  return step.problems.some(pid => userProgress.completedProblems.includes(pid));
}

function renderBasicRoadmap() {
  const timeline = document.getElementById("basicRoadmapTimeline");
  if (!timeline) return;

  let html = "";

  roadmapSteps.forEach((step, index) => {
    const isCompleted = isRoadmapStepCompleted(step);
    
    // Determine if step is unlocked (either step 1 or previous step is completed)
    let isUnlocked = false;
    if (index === 0) {
      isUnlocked = true;
    } else {
      const prevStep = roadmapSteps[index - 1];
      isUnlocked = isRoadmapStepCompleted(prevStep);
    }

    let statusClass = "locked";
    let statusText = "Locked";
    let statusTagClass = "locked-tag";

    if (isCompleted) {
      statusClass = "completed";
      statusText = "Completed";
      statusTagClass = "completed-tag";
    } else if (isUnlocked) {
      statusClass = "active";
      statusText = "Active";
      statusTagClass = "active-tag";
    }

    // Calculate progress
    let progressPercent = 0;
    let progressText = "";
    if (step.type === "quiz") {
      progressPercent = isCompleted ? 100 : 0;
      progressText = isCompleted ? "Passed" : "Not Started";
    } else {
      const totalProblems = step.problems.length;
      const solvedProblems = step.problems.filter(pid => userProgress.completedProblems.includes(pid)).length;
      progressPercent = Math.round((solvedProblems / totalProblems) * 100);
      progressText = `${solvedProblems}/${totalProblems} Solved`;
    }

    // Determine Step Icon
    let stepIcon = `<i class="fa-solid ${step.icon}"></i>`;
    if (isCompleted) {
      stepIcon = `<i class="fa-solid fa-check"></i>`;
    } else if (statusClass === "locked") {
      stepIcon = `<i class="fa-solid fa-lock"></i>`;
    }

    html += `
      <div class="roadmap-step ${statusClass}" data-step="${step.id}">
        <div class="step-marker-dot">
          ${stepIcon}
        </div>
        <div class="roadmap-step-card">
          <div class="step-card-header">
            <span class="step-number">Step ${step.id}</span>
            <span class="step-status-tag ${statusTagClass}">${statusText}</span>
          </div>
          <h3 class="step-title">${step.title}</h3>
          <p class="step-desc">${step.desc}</p>
          <div class="step-card-footer">
            <div class="step-progress">
              <div class="step-progress-label">Progress: ${progressText} (${progressPercent}%)</div>
              <div class="step-progress-bar-container">
                <div class="step-progress-bar-fill" style="width: ${progressPercent}%;"></div>
              </div>
            </div>
            ${isUnlocked 
              ? `<button class="btn btn-primary btn-sm" onclick="openRoadmapStepModal(${index}, 'basic')">${isCompleted ? 'Review Step' : 'Start Step'}</button>`
              : `<button class="btn btn-secondary btn-sm" disabled><i class="fa-solid fa-lock"></i> Locked</button>`
            }
          </div>
        </div>
      </div>
    `;
  });

  timeline.innerHTML = html;
}

function renderAdvancedRoadmap() {
  const timeline = document.getElementById("advancedRoadmapTimeline");
  if (!timeline) return;

  let html = "";

  advancedRoadmapSteps.forEach((step, index) => {
    const isCompleted = isRoadmapStepCompleted(step);
    
    // Determine if step is unlocked (either step 1 or previous step is completed)
    let isUnlocked = false;
    if (index === 0) {
      isUnlocked = true;
    } else {
      const prevStep = advancedRoadmapSteps[index - 1];
      isUnlocked = isRoadmapStepCompleted(prevStep);
    }

    let statusClass = "locked";
    let statusText = "Locked";
    let statusTagClass = "locked-tag";

    if (isCompleted) {
      statusClass = "completed";
      statusText = "Completed";
      statusTagClass = "completed-tag";
    } else if (isUnlocked) {
      statusClass = "active";
      statusText = "Active";
      statusTagClass = "active-tag";
    }

    // Calculate progress
    let progressPercent = 0;
    let progressText = "";
    if (step.type === "quiz") {
      progressPercent = isCompleted ? 100 : 0;
      progressText = isCompleted ? "Passed" : "Not Started";
    } else {
      const totalProblems = step.problems.length;
      const solvedProblems = step.problems.filter(pid => userProgress.completedProblems.includes(pid)).length;
      progressPercent = Math.round((solvedProblems / totalProblems) * 100);
      progressText = `${solvedProblems}/${totalProblems} Solved`;
    }

    // Determine Step Icon
    let stepIcon = `<i class="fa-solid ${step.icon}"></i>`;
    if (isCompleted) {
      stepIcon = `<i class="fa-solid fa-check"></i>`;
    } else if (statusClass === "locked") {
      stepIcon = `<i class="fa-solid fa-lock"></i>`;
    }

    html += `
      <div class="roadmap-step ${statusClass}" data-step="${step.id}">
        <div class="step-marker-dot">
          ${stepIcon}
        </div>
        <div class="roadmap-step-card">
          <div class="step-card-header">
            <span class="step-number">Step ${step.id}</span>
            <span class="step-status-tag ${statusTagClass}">${statusText}</span>
          </div>
          <h3 class="step-title">${step.title}</h3>
          <p class="step-desc">${step.desc}</p>
          <div class="step-card-footer">
            <div class="step-progress">
              <div class="step-progress-label">Progress: ${progressText} (${progressPercent}%)</div>
              <div class="step-progress-bar-container">
                <div class="step-progress-bar-fill" style="width: ${progressPercent}%;"></div>
              </div>
            </div>
            ${isUnlocked 
              ? `<button class="btn btn-primary btn-sm" onclick="openRoadmapStepModal(${index}, 'advanced')">${isCompleted ? 'Review Step' : 'Start Step'}</button>`
              : `<button class="btn btn-secondary btn-sm" disabled><i class="fa-solid fa-lock"></i> Locked</button>`
            }
          </div>
        </div>
      </div>
    `;
  });

  timeline.innerHTML = html;
}

function selectQuizOption(stepId, qIndex, oIndex, element) {
  const container = element.closest(".quiz-question-container");
  container.querySelectorAll(".quiz-option-item").forEach(el => el.classList.remove("selected"));
  element.classList.add("selected");
  currentQuizAnswers[qIndex] = oIndex;
}

function openCodingProblem(problemId) {
  const modal = document.getElementById("roadmapStepModal");
  if (modal) {
    modal.classList.remove("active");
  }
  handleProblemClick(problemId);
}

function openRoadmapStepModal(stepIndex, type = 'basic') {
  const steps = type === 'basic' ? roadmapSteps : advancedRoadmapSteps;
  const step = steps[stepIndex];
  if (!step) return;

  const modal = document.getElementById("roadmapStepModal");
  if (!modal) return;

  currentQuizAnswers = {};

  document.getElementById("roadmapStepBadge").textContent = `Step ${step.id}`;
  document.getElementById("roadmapStepModalTitle").textContent = step.title;
  document.getElementById("roadmapStepTheoryContent").innerHTML = step.theory;

  // Render complexity reference if available
  const complexitySection = document.getElementById("roadmapStepComplexitySection");
  if (step.complexity && step.complexity.length > 0) {
    complexitySection.classList.remove("hidden");
    const body = document.getElementById("roadmapStepComplexityBody");
    body.innerHTML = step.complexity.map(item => `
      <tr>
        <td>${item.op}</td>
        <td>${item.time}</td>
        <td>${item.space}</td>
      </tr>
    `).join("");
  } else {
    complexitySection.classList.add("hidden");
  }

  // Render quiz section or coding problems section
  const quizSection = document.getElementById("roadmapStepQuizSection");
  const problemsSection = document.getElementById("roadmapStepProblemsSection");

  if (step.type === "quiz") {
    quizSection.classList.remove("hidden");
    problemsSection.classList.add("hidden");

    const quizContent = document.getElementById("roadmapStepQuizContent");
    const isCompleted = userProgress.completedRoadmapSteps.includes(step.id);

    quizContent.innerHTML = step.quiz.map((q, qIndex) => {
      return `
        <div class="quiz-question-container" data-qindex="${qIndex}">
          <div class="quiz-question-text">${qIndex + 1}. ${q.question}</div>
          <ul class="quiz-options-list">
            ${q.options.map((opt, oIndex) => {
              let classes = "quiz-option-item";
              let styleAttr = "";
              if (isCompleted) {
                if (oIndex === q.correct) {
                  classes += " correct";
                }
                styleAttr = 'style="pointer-events: none; cursor: default;"';
              }
              return `
                <li class="${classes}" ${styleAttr} data-oindex="${oIndex}" onclick="${isCompleted ? '' : `selectQuizOption(${step.id}, ${qIndex}, ${oIndex}, this)`}">
                  ${opt}
                </li>
              `;
            }).join("")}
          </ul>
          <div class="quiz-feedback ${isCompleted ? 'correct' : 'hidden'}">
            ${isCompleted ? `Correct! ${q.explanation}` : ''}
          </div>
        </div>
      `;
    }).join("");

    const submitBtn = document.getElementById("roadmapStepSubmitQuizBtn");
    if (isCompleted) {
      submitBtn.style.display = "none";
    } else {
      submitBtn.style.display = "block";
      submitBtn.onclick = () => submitRoadmapQuiz(stepIndex, type);
    }

  } else {
    quizSection.classList.add("hidden");
    problemsSection.classList.remove("hidden");

    const problemsList = document.getElementById("roadmapStepProblemsList");
    problemsList.innerHTML = step.problems.map(pid => {
      const prob = practiceProblems.find(p => p.id === pid);
      if (!prob) return "";

      const isSolved = userProgress.completedProblems.includes(pid);
      return `
        <li class="roadmap-problem-item">
          <div class="roadmap-problem-info">
            <span class="roadmap-problem-title">${prob.title}</span>
            <div class="roadmap-problem-meta">
              <span class="difficulty-badge ${getDifficultyClass(prob.difficulty)}">${prob.difficulty}</span>
              <span>Acceptance: ${prob.acceptance}</span>
            </div>
          </div>
          <div class="roadmap-problem-action">
            ${isSolved 
              ? `<span class="roadmap-problem-status completed"><i class="fas fa-check-circle"></i> Solved</span>`
              : `<button class="btn btn-outline btn-sm" onclick="openCodingProblem(${pid})"><i class="fas fa-play"></i> Solve</button>`
            }
          </div>
        </li>
      `;
    }).join("");
  }

  modal.classList.add("active");
}

function submitRoadmapQuiz(stepIndex, type = 'basic') {
  const steps = type === 'basic' ? roadmapSteps : advancedRoadmapSteps;
  const step = steps[stepIndex];
  const container = document.getElementById("roadmapStepQuizContent");
  let allCorrect = true;
  let allAnswered = true;

  step.quiz.forEach((q, qIndex) => {
    const qContainer = container.querySelector(`[data-qindex="${qIndex}"]`);
    const selectedOptionIndex = currentQuizAnswers[qIndex];
    if (selectedOptionIndex === undefined) {
      allAnswered = false;
    }
  });

  if (!allAnswered) {
    showNotification("Please answer all questions before submitting!", "error");
    return;
  }

  step.quiz.forEach((q, qIndex) => {
    const qContainer = container.querySelector(`[data-qindex="${qIndex}"]`);
    const feedbackEl = qContainer.querySelector(".quiz-feedback");
    const selectedOptionIndex = currentQuizAnswers[qIndex];

    qContainer.querySelectorAll(".quiz-option-item").forEach((optEl, oIndex) => {
      optEl.classList.remove("selected", "correct", "incorrect");
      optEl.style.pointerEvents = "none";
      optEl.style.cursor = "default";
      if (oIndex === q.correct) {
        optEl.classList.add("correct");
      } else if (oIndex === selectedOptionIndex) {
        optEl.classList.add("incorrect");
      }
    });

    feedbackEl.classList.remove("hidden", "correct", "incorrect");
    if (selectedOptionIndex === q.correct) {
      feedbackEl.textContent = `Correct! ${q.explanation}`;
      feedbackEl.className = "quiz-feedback correct";
    } else {
      allCorrect = false;
      feedbackEl.textContent = `Incorrect. ${q.explanation}`;
      feedbackEl.className = "quiz-feedback incorrect";
    }
  });

  if (allCorrect) {
    if (!userProgress.completedRoadmapSteps.includes(step.id)) {
      userProgress.completedRoadmapSteps.push(step.id);
      addXP(50);
      saveUserData();
      showNotification(`🎉 Quiz Passed! Step ${step.id} Completed. +50 XP!`, "success");
      
      updateDashboard();
      updateGamification();
      initRoadmap();
    }
    
    const submitBtn = document.getElementById("roadmapStepSubmitQuizBtn");
    if (submitBtn) {
      submitBtn.style.display = "none";
    }
  } else {
    showNotification("Some answers were incorrect. Please review the feedback and try again!", "error");
    // Re-enable quiz elements if incorrect so they can retry
    setTimeout(() => {
      step.quiz.forEach((q, qIndex) => {
        const qContainer = container.querySelector(`[data-qindex="${qIndex}"]`);
        const feedbackEl = qContainer.querySelector(".quiz-feedback");
        const selectedOptionIndex = currentQuizAnswers[qIndex];
        if (selectedOptionIndex !== q.correct) {
          qContainer.querySelectorAll(".quiz-option-item").forEach((optEl) => {
            optEl.style.pointerEvents = "auto";
            optEl.style.cursor = "pointer";
            optEl.classList.remove("correct", "incorrect");
            if (optEl.classList.contains("selected")) {
              optEl.classList.remove("selected");
            }
          });
          feedbackEl.classList.add("hidden");
          delete currentQuizAnswers[qIndex];
        }
      });
    }, 3000);
  }
}

// Bind handlers to global window object
window.selectQuizOption = selectQuizOption;
window.submitRoadmapQuiz = submitRoadmapQuiz;
window.openCodingProblem = openCodingProblem;
window.openRoadmapStepModal = openRoadmapStepModal;

// ===== PROFILE =====
function initProfile() {

    var profileName = document.getElementById("profileName");
    if (profileName) {
        profileName.textContent = userProgress.name;
    }
    
    // Set joined date
    var joinDate = document.getElementById("joinDate");
    if (joinDate) {
        let joinDateObj;
        if (userProgress.joinDate) {
            joinDateObj = new Date(userProgress.joinDate);
        } else {
            joinDateObj = new Date();
            userProgress.joinDate = joinDateObj.toISOString();
            saveUserData();
        }
        joinDate.textContent = joinDateObj.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
        });
    }
    
    // Set current date in dashboard
    var currentDateElement = document.getElementById("current-date");
    if (currentDateElement) {
        var today = new Date();
        currentDateElement.textContent = "Today: " + today.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
        });
    }
    
    // Set current date in dashboard card
    var dashboardCurrentDateElement = document.getElementById("dashboard-current-date");
    if (dashboardCurrentDateElement) {
        var today = new Date();
        dashboardCurrentDateElement.textContent = "Today: " + today.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
        });
    }
    
    var avatarIcon = document.querySelector('.avatar-icon');
    if (avatarIcon) {
        avatarIcon.textContent = userProgress.avatar || '🚀';
    }
    updateProfile();

  var profileName = document.getElementById("profileName") || document.getElementById("profileDashboardName");
  if (profileName) {
    profileName.textContent = userProgress.name;
  }
  
  // Set join date in userProgress if missing
  if (!userProgress.joinDate) {
    userProgress.joinDate = new Date().toISOString();
    saveUserData();
  }

  var joinDate = document.getElementById("joinDate");
  var joinDateSection = document.getElementById("joinDateSection") || document.getElementById("joinDateDashboard");
  if (joinDate || joinDateSection) {
    var dateVal = new Date(userProgress.joinDate);
    var formattedDate = isNaN(dateVal.getTime()) ? userProgress.joinDate : dateVal.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    if (joinDate) joinDate.textContent = formattedDate;
    if (joinDateSection) joinDateSection.textContent = formattedDate;
  }
  var currentDate = document.getElementById("current-date");
  if (currentDate) {
    currentDate.textContent = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }
  var avatarIcon = document.querySelector(".avatar-icon");
  if (avatarIcon) {
    avatarIcon.textContent = userProgress.avatar || "🚀";
  }
  updateProfile();

}

function updateProfile() {
  var levelNames = [
    "Beginner",
    "Novice",
    "Intermediate",
    "Advanced",
    "Expert",
    "Master",
    "Grandmaster",
    "Legend",
  ];
  var profileLevel = document.getElementById("profileLevel");
  if (profileLevel) {
    profileLevel.textContent =
      "Level " +
      userProgress.level +
      " - " +
      levelNames[userProgress.level - 1];
  }

  // Profile Section Level
  var profileLevelSection = document.getElementById("profileLevelSection");
  if (profileLevelSection) {
    profileLevelSection.textContent =
      "Level " +
      userProgress.level +
      " - " +
      levelNames[userProgress.level - 1];
  }

  var profileXP = document.getElementById("profileTotalXP");
  if (profileXP) profileXP.textContent = userProgress.xp.toLocaleString();

  // Profile Section XP
  var profileXPSection = document.getElementById("profileTotalXPSection");
  if (profileXPSection)
    profileXPSection.textContent = userProgress.xp.toLocaleString();

  var profileProblems = document.getElementById("profileProblems");
  if (profileProblems)
    profileProblems.textContent = userProgress.completedProblems.length;

  // Profile Section Problems
  var profileProblemsSection = document.getElementById(
    "profileProblemsSection",
  );
  if (profileProblemsSection)
    profileProblemsSection.textContent = userProgress.completedProblems.length;

  var profileStreak = document.getElementById("profileStreak");
  if (profileStreak) profileStreak.textContent = userProgress.streak;

  var profileFreezes = document.getElementById("profileFreezes");
  if (profileFreezes) profileFreezes.textContent = userProgress.freezes || 0;

  var profileSectionStreak = document.getElementById("profileSectionStreak");
  if (profileSectionStreak)
    profileSectionStreak.textContent = userProgress.streak;
    
  var profileSectionFreezes = document.getElementById("profileSectionFreezes");
  if (profileSectionFreezes)
    profileSectionFreezes.textContent = userProgress.freezes || 0;

  var profileBadges = document.getElementById("profileBadges");

  if (profileBadges) {
    var badges = [
      userProgress.completedProblems.length >= 1,
      userProgress.streak >= 7,
      userProgress.xp >= 5000,
      userProgress.completedProblems.length >= 50,
      userProgress.completedProblems.length >= 100,
      userProgress.completedProblems.length >= 25 && userProgress.xp >= 2500,
    ].filter(Boolean).length;

    profileBadges.textContent = badges;

    // Profile Section Badges
    var profileBadgesSection = document.getElementById("profileBadgesSection");

    if (profileBadgesSection) {
      profileBadgesSection.textContent = badges;
    }
  }

  // Update profile name in dashboard
  var dashboardProfileName = document.getElementById("profileName") || document.getElementById("profileDashboardName");
  if (dashboardProfileName) {
    dashboardProfileName.textContent = userProgress.name;
  }

  // Update profile name in profile section
  var profileSectionName = document.getElementById("profileSectionName");
  if (profileSectionName) {
    profileSectionName.textContent = userProgress.name;
  }

  // Update avatar
  document.querySelectorAll(".avatar-icon").forEach((el) => {
    el.textContent = userProgress.avatar || "🚀";
  });

  updateLevelProgress();
  updateSkillsSection();
  updateDifficultyBreakdown();
}

function updateLevelProgress() {
  var levels = [0, 1000, 2500, 5000, 10000, 20000, 50000, 100000];

  var currentLevel = userProgress.level;

  var currentLevelXP = levels[Math.max(0, currentLevel - 1)];

  var nextLevelXP = levels[currentLevel] || 100000;

  var xpProgress =
    ((userProgress.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

  var progressPercent = Math.min(Math.max(xpProgress, 0), 100);

  // Dashboard Progress Bar
  var progressBar = document.getElementById("profileProgressBar");

  var progressLabel = document.getElementById("profileLevelProgress");

  if (progressBar) progressBar.style.width = progressPercent + "%";

  if (progressLabel)
    progressLabel.textContent = Math.round(progressPercent) + "%";

  // Profile Section Progress Bar
  var progressBarSection = document.getElementById("profileProgressBarSection");

  var progressLabelSection = document.getElementById(
    "profileLevelProgressSection",
  );

  if (progressBarSection)
    progressBarSection.style.width = progressPercent + "%";

  if (progressLabelSection)
    progressLabelSection.textContent = Math.round(progressPercent) + "%";
}
function updateSkillsSection() {
  const container = document.getElementById("skillsContainer");
  if (!container) return;

  const topics = [
    { name: "Arrays", category: "arrays", icon: "📊" },
    { name: "Strings", category: "strings", icon: "🔤" },
    { name: "Linked List", category: "linkedlist", icon: "🔗" },
    { name: "Trees", category: "trees", icon: "🌳" },
    { name: "Graphs", category: "graphs", icon: "🕸️" },
    { name: "Dynamic Programming", category: "dp", icon: "🎯" },
  ];

  const completed = userProgress.completedProblems || [];

  container.innerHTML = topics.map(topic => {
    const topicProblems = practiceProblems.filter(p => p.category === topic.category);
    const solvedCount = topicProblems.filter(p => completed.includes(p.id)).length;
    const total = topicProblems.length || 1;
    const percent = Math.round((solvedCount / total) * 100);

    return `
      <div class="skill-item">
        <div class="skill-header">
          <span>${topic.icon} ${topic.name}</span>
          <span>${solvedCount}/${total} (${percent}%)</span>
        </div>
        <div class="skill-bar">
          <div class="skill-fill" style="width:${percent}%"></div>
        </div>
      </div>
    `;
  }).join("");
}

function updateDifficultyBreakdown() {
  const completed = userProgress.completedProblems || [];

  const easy = practiceProblems.filter(p =>
    completed.includes(p.id) && p.difficulty === "easy").length;
  const medium = practiceProblems.filter(p =>
    completed.includes(p.id) && p.difficulty === "medium").length;
  const hard = practiceProblems.filter(p =>
    completed.includes(p.id) && p.difficulty === "hard").length;

  const easyEl = document.getElementById("easyCount");
  const mediumEl = document.getElementById("mediumCount");
  const hardEl = document.getElementById("hardCount");

  if (easyEl) easyEl.textContent = easy;
  if (mediumEl) mediumEl.textContent = medium;
  if (hardEl) hardEl.textContent = hard;
}

// ===== DASHBOARD =====
function initDashboard() {
  updateDashboard();
  updateProfile();
}

function updateDashboard() {
  const completedProblemsEl = document.getElementById("completedProblems");
  if (completedProblemsEl) completedProblemsEl.textContent = userProgress.completedProblems.length;

  const currentStreakEl = document.getElementById("currentStreak");
  if (currentStreakEl) currentStreakEl.textContent = userProgress.streak;

  var currentFreezes = document.getElementById("currentFreezes");
  if (currentFreezes) currentFreezes.textContent = userProgress.freezes || 0;

  const totalXPEl = document.getElementById("totalXP");
  if (totalXPEl) totalXPEl.textContent = userProgress.xp;

  updateCurrentDate();
  updateActivityList();
  renderActivityHeatmap();
  if (typeof updateFreezeHistoryList === "function") {
    updateFreezeHistoryList();
  }
  updateBadges();
  updateRecentProblems(); // Recently Viewed Problems
  updateLeaderboard();

  // Dynamic Coding Personality Card Injection
  const grid = document.querySelector(".dashboard-grid");
  if (grid && !document.getElementById("personalityCard")) {
    const pCard = document.createElement("div");
    pCard.className = "dashboard-card personality-card";
    pCard.id = "personalityCard";
    const profileCard = grid.querySelector(".profile-card");
    if (profileCard) {
      profileCard.after(pCard);
    } else {
      grid.prepend(pCard);
    }
  }
  renderPersonalityCard();

  // Dynamic Mistake DNA Card Injection
  if (grid && !document.getElementById("mistakeDnaCard")) {
    const mCard = document.createElement("div");
    mCard.className = "dashboard-card mistake-dna-card";
    mCard.id = "mistakeDnaCard";
    const personalityCard = document.getElementById("personalityCard");
    if (personalityCard) {
      personalityCard.after(mCard);
    } else {
      const profileCard = grid.querySelector(".profile-card");
      if (profileCard) {
        profileCard.after(mCard);
      } else {
        grid.prepend(mCard);
      }
    }
  }
  renderMistakeDnaCard();
}

function updateCurrentDate() {
  const dateEl = document.getElementById("dashboard-current-date");
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
}

function updateActivityList() {
  const activityList = document.getElementById("activityList");

  if (!activityList) return;

  if (userProgress.completedProblems.length === 0) {
    activityList.innerHTML =
      '<p class="empty-state">No recent activity. Start solving problems!</p>';
    return;
  }

  const activities = userProgress.completedProblems.slice(-5).map((pid) => {
    const problem = practiceProblems.find((p) => p.id === pid);
    return {
      problem: problem ? problem.title : "Unknown",
      time: "Today",
    };
  });

  activityList.innerHTML = activities
    .map(
      (activity) => `
        <div class="activity-item">
            <div class="activity-type">
                <span class="activity-icon"><i class="fas fa-code"></i></span>
                <span>Solved: ${activity.problem}</span>
            </div>
            <span class="activity-time">${activity.time}</span>
        </div>
    `,
    )
    .join("");
}
// ===== RECENTLY VIEWED PROBLEMS ===== //
function updateRecentProblems() {
  const container = document.getElementById("recentProblemsList");

  if (!container) return;

  if (
    !userProgress.recentProblems ||
    userProgress.recentProblems.length === 0
  ) {
    container.innerHTML = "<p>No recently viewed problems</p>";
    return;
  }

  container.innerHTML = userProgress.recentProblems
    .map((id) => {
      const problem = practiceProblems.find((p) => p.id === id);

      if (!problem) return "";

      return `
        <div class="recent-problem" data-id="${problem.id}">
          ${problem.title}
        </div>
      `;
    })
    .join("");

  container.querySelectorAll(".recent-problem").forEach((item) => {
    item.addEventListener("click", () => {
      const problemId = parseInt(item.dataset.id);

      const problem = practiceProblems.find((p) => p.id === problemId);

      if (problem) {
        openQuizEditor(problem);
      }
    });
  });
}

function updateFreezeHistoryList() {
  const freezeHistoryList = document.getElementById("freezeHistoryList");
  if (!freezeHistoryList) return;

  const history = userProgress.freezeHistory || [];
  if (history.length === 0) {
    freezeHistoryList.innerHTML = '<p class="empty-state">No freezes used yet.</p>';
    return;
  }

  const historyItems = history.slice(-5).reverse().map(h => {
    return `
      <div class="activity-item">
        <div class="activity-type">
            <span class="activity-icon"><i class="fas fa-snowflake" style="color: #00d2ff;"></i></span>
            <span>${h.reason}</span>
        </div>
        <span class="activity-time">${new Date(h.date).toLocaleDateString()}</span>
      </div>
    `;
  });

  freezeHistoryList.innerHTML = historyItems.join("");
}

function updateBadges() {
  const container = document.getElementById("badgesContainer");
  const grid = document.getElementById("badgesGrid");

  const badges = [
    {
      id: 1,
      icon: "🌟",
      name: "First Steps",
      description: "Begin your journey",
      criteria: "Solve 1 problem",
      earned: userProgress.completedProblems.length >= 1,
    },
    {
      id: 2,
      icon: "🔥",
      name: "On Fire",
      description: "Keep the momentum going",
      criteria: "Maintain a 7-day streak",
      earned: userProgress.streak >= 7,
    },
    {
      id: 3,
      icon: "💎",
      name: "Diamond",
      description: "Reach a major XP milestone",
      criteria: "Earn 5,000 XP",
      earned: userProgress.xp >= 5000,
    },
    {
      id: 4,
      icon: "🚀",
      name: "Rocket",
      description: "Speed through problems",
      criteria: "Solve 50 problems",
      earned: userProgress.completedProblems.length >= 50,
    },
    {
      id: 5,
      icon: "👑",
      name: "Master",
      description: "Achieve expert problem-solving",
      criteria: "Solve 100 problems",
      earned: userProgress.completedProblems.length >= 100,
    },
    {
      id: 6,
      icon: "🎯",
      name: "Sharpshooter",
      description: "Hit the target with consistency",
      criteria: "Solve 25 problems and earn 2,500 XP",
      earned:
        userProgress.completedProblems.length >= 25 && userProgress.xp >= 2500,
    },
  ];

  // Update userProgress badges
  const newlyEarned = badges.filter((b) => b.earned).map((b) => b.id);

  // Only save if badges changed to avoid unnecessary saves
  const badgesChanged =
    JSON.stringify(newlyEarned) !== JSON.stringify(userProgress.badges);
  userProgress.badges = newlyEarned;
  if (badgesChanged) {
    saveUserData();
  }

  // Dashboard badges
  if (container) {
  container.innerHTML = badges
    .map(
      (badge) =>
        `<div class="badge ${badge.earned ? "" : "locked"}" tabindex="0" aria-label="${badge.name}: ${badge.description}. ${badge.criteria}">
            ${badge.icon}
            <span class="badge-tooltip">
              <strong>${badge.name}</strong>
              <span>${badge.description}</span>
              <span>${badge.criteria}</span>
            </span>
        </div>`,
    )
    .join("");
  }

  // Gamification section badges
  if (grid) {
  grid.innerHTML = badges
    .map(
      (badge) =>
        `<div class="badge-lg ${badge.earned ? "earned" : "locked"}" 
          tabindex="0" 
          title="${badge.name}: ${badge.criteria}"
          onclick="${badge.earned ? "" : `showNotification('🔒 ${badge.criteria}', 'info')`}">
          <span class="badge-icon">${badge.icon}</span>
          <span class="badge-name">${badge.name}</span>
          <span class="badge-criteria">${badge.earned ? "✅ Earned!" : badge.criteria}</span>
        </div>`,
    )
    .join("");
    
  }
}

function updateLeaderboard() {
  const leaderboardList = document.getElementById("leaderboardList");

  if (!leaderboardList) return;

  const requestId = ++leaderboardRequestId;
  renderLeaderboardRows(buildLeaderboardRows([], getCurrentUserId()), getCurrentUserId(), {
    emptyMessage: "Loading leaderboard...",
  });

  loadLeaderboard()
    .then(({ leaders, currentUserId }) => {
      if (requestId !== leaderboardRequestId) return;
      const resolvedCurrentUserId = currentUserId || getCurrentUserId();
      const rows = buildLeaderboardRows(leaders, resolvedCurrentUserId);
      renderLeaderboardRows(rows, resolvedCurrentUserId);
    })
    .catch((error) => {
      console.warn("Could not load leaderboard:", error);
      if (requestId !== leaderboardRequestId) return;
      renderLeaderboardRows(buildLeaderboardRows([], getCurrentUserId()), getCurrentUserId(), {
        emptyMessage: "Leaderboard unavailable. Showing your local progress.",
      });
    });
}

async function loadLeaderboard() {
  if (location.protocol === "file:") {
    return { leaders: [], currentUserId: null };
  }

  const response = await fetch("/api/leaderboard", { credentials: "include" });
  if (!response.ok) throw new Error("Leaderboard request failed.");
  return response.json();
}

function buildLeaderboardRows(leaders = [], currentUserId = getCurrentUserId()) {
  const rowsById = new Map();
  leaders.forEach((leader) => {
    const normalized = normalizeLeaderboardEntry(leader);
    if (normalized.id) rowsById.set(normalized.id, normalized);
  });

  const currentEntry = getCurrentLeaderboardEntry(currentUserId);
  // Prevent duplicate 'You' entries for guests unless they've actually earned XP locally
  if (currentUserId !== "local-user" || userProgress.xp > 350 || leaders.length === 0) {
    rowsById.set(currentEntry.id, currentEntry);
  }

  const rankedRows = Array.from(rowsById.values())
    .sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name))
    .map((leader, index) => ({ ...leader, rank: index + 1 }));

  const visibleRows = rankedRows.slice(0, LEADERBOARD_LIMIT);
  if (!visibleRows.some((leader) => leader.id === currentEntry.id)) {
    const currentRow = rankedRows.find((leader) => leader.id === currentEntry.id);
    if (currentRow) visibleRows[visibleRows.length - 1] = currentRow;
  }

  return visibleRows;
}

function normalizeLeaderboardEntry(entry) {
  return {
    id: String(entry.id || ""),
    name: String(entry.name || "Learner"),
    xp: Math.max(0, Number(entry.xp) || 0),
    level: Math.max(1, Number(entry.level) || 1),
    avatar: String(entry.avatar || "🚀"),
    rank: Number(entry.rank) || null,
  };
}

function getCurrentLeaderboardEntry(currentUserId = getCurrentUserId()) {
  return normalizeLeaderboardEntry({
    id: currentUserId || "local-user",
    name: getCurrentDisplayName(),
    xp: userProgress.xp,
    level: userProgress.level,
    avatar: userProgress.avatar,
  });
}

function getCurrentUserId() {
  return window.algoAuth?.user?.sub || window.algoAuth?.user?.id || cachedSession?.user?.sub || "local-user";
}

function getCurrentDisplayName() {
  return window.algoAuth?.user?.name || cachedSession?.user?.name || userProgress.name || "Learner";
}

function renderLeaderboardRows(rows, currentUserId = getCurrentUserId(), options = {}) {
  const leaderboardList = document.getElementById("leaderboardList");
  if (!leaderboardList) return;

  if (!rows.length) {
    leaderboardList.innerHTML = `<p class="empty-state">${options.emptyMessage || "No leaderboard data yet."}</p>`;
    return;
  }

  leaderboardList.innerHTML = rows
    .map((user) => {
      const isCurrentUser = user.id === currentUserId || (currentUserId === "local-user" && user.id === "local-user");
      const displayName = isCurrentUser ? `${user.name} (You)` : user.name;

      return `
        <div class="leaderboard-item ${isCurrentUser ? "current-user" : ""}">
            <span class="leader-rank">#${user.rank}</span>
            <span class="leader-avatar" aria-hidden="true">${escapeHtml(user.avatar)}</span>
            <span class="leader-name">${escapeHtml(displayName)}</span>
            <span class="leader-xp">${user.xp.toLocaleString()} XP</span>
        </div>
    `;
    })
    .join("");
}

// ===== GAMIFICATION =====
function initGamification() {
  updateXPBar();
}

function initDailyChallenge() {
  const card = document.getElementById("dailyChallengeCard");
  const textEl = document.getElementById("dailyChallengeText");
  const btn = document.getElementById("completeChallengeBtn");

  if (!card || !textEl || !btn) return;

  const challengeIndex = getDayOfYear() % dailyChallenges.length;
  const challenge = dailyChallenges[challengeIndex];

  const completedChallenges = userProgress.completedDailyChallenges || [];
  const alreadyCompleted = completedChallenges.includes(challenge.id);

  textEl.textContent = `${challenge.title}: ${challenge.description}`;
  btn.disabled = alreadyCompleted;
  btn.innerHTML = alreadyCompleted
    ? "Challenge Completed ✓"
    : `<i class="fas fa-bolt"></i> Complete Challenge (+${challenge.xpReward} XP)`;

  btn.addEventListener("click", () => {
    if (!userProgress.completedDailyChallenges) {
      userProgress.completedDailyChallenges = [];
    }
    if (!userProgress.completedDailyChallenges.includes(challenge.id)) {
      userProgress.completedDailyChallenges.push(challenge.id);
      addXP(challenge.xpReward);
      saveUserData();
      showNotification(
        `Challenge completed! +${challenge.xpReward} XP earned! 🚀`,
        "success"
      );
      btn.disabled = true;
      btn.textContent = "Challenge Completed ✓";
    }
  });
}

function addXP(amount) {
  userProgress.xp += amount;
  checkLevelUp();
  saveUserData();
}

function checkLevelUp() {
  const levels = [0, 1000, 2500, 5000, 10000, 20000, 50000, 100000];
  const levelNames = [
    "Beginner",
    "Novice",
    "Intermediate",
    "Advanced",
    "Expert",
    "Master",
    "Grandmaster",
    "Legend",
  ];

  let newLevel = 1;
  for (let i = levels.length - 1; i >= 0; i--) {
    if (userProgress.xp >= levels[i]) {
      newLevel = i + 1;
      break;
    }
  }

  if (newLevel > userProgress.level) {
    // Level up notification
    showNotification(
      `🎉 Level Up! You're now Level ${newLevel} - ${levelNames[newLevel - 1]}`,
      "success",
    );
  }

  userProgress.level = newLevel;
  document.getElementById("levelBadge").textContent =
    `Level ${newLevel} - ${levelNames[newLevel - 1]}`;
}

function updateGamification() {
  updateXPBar();
  updateBadges();
  updateStreakDisplay();
  updateActivityFeed();
  updateXPStats();
}

function updateXPStats() {
  const totalProblems = document.getElementById("totalProblemsCount");
  const streakEl = document.getElementById("streakCount");
  const totalXP = document.getElementById("totalXPCount");
  const nextLevel = document.getElementById("xpNextLevel");
  const badgesCount = document.getElementById("badgesEarnedCount");

  if (totalProblems) totalProblems.textContent = userProgress.completedProblems.length;
  if (streakEl) streakEl.textContent = `${userProgress.streak || 0}🔥`;
  if (totalXP) totalXP.textContent = userProgress.xp || 0;

  const levelNames = ["Beginner","Novice","Intermediate","Advanced","Expert","Master","Grandmaster","Legend"];
  const currentLevel = userProgress.level || 1;
  if (nextLevel) nextLevel.textContent = `Next: ${levelNames[currentLevel] || "Legend"}`;

  const earned = userProgress.badges ? userProgress.badges.length : 0;
  if (badgesCount) badgesCount.textContent = `${earned}/6 earned`;
}

function updateStreakDisplay() {
  const streakNum = document.getElementById("streakNumber");
  const bestStreakEl = document.getElementById("bestStreak");
  const streakWeek = document.getElementById("streakWeek");

  const streak = userProgress.streak || 0;
  const bestStreak = userProgress.bestStreak || streak;

  if (streakNum) streakNum.textContent = streak;
  if (bestStreakEl) bestStreakEl.textContent = bestStreak;

  if (streakWeek) {
    const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const today = new Date().getDay();
    streakWeek.innerHTML = days.map((day, i) => {
      const isActive = i < streak && i <= today;
      return `
        <div class="streak-day ${isActive ? "active" : "inactive"}">
          <span>${isActive ? "🔥" : "○"}</span>
          <span>${day}</span>
        </div>
      `;
    }).join("");
  }
}

function updateActivityFeed() {
  const activityList = document.getElementById("activityList");
  if (!activityList) return;

  const completed = userProgress.completedProblems || [];
  if (completed.length === 0) {
    activityList.innerHTML = `<p class="activity-empty">No activity yet. Start solving problems! 🚀</p>`;
    return;
  }

  const recent = completed.slice(-5).reverse();
  activityList.innerHTML = recent.map(id => {
    const problem = practiceProblems.find(p => p.id === id);
    if (!problem) return "";
    const xp = getXPForDifficulty(problem.difficulty);
    return `
      <div class="activity-item">
        <span class="activity-name">✅ ${problem.title}</span>
        <span class="activity-xp">+${xp} XP</span>
      </div>
    `;
  }).join("");
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === "success" ? "var(--gradient-4)" : type === "error" ? "#ef4444" : "var(--primary)"};
        color: ${type === "success" ? "var(--dark-bg)" : "white"};
        border-radius: 10px;
        box-shadow: var(--glass-shadow);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-weight: 600;
        max-width: 350px;
    `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateX(100%)";
    notification.style.transition = "all 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function updateXPBar() {
  const levels = [0, 1000, 2500, 5000, 10000, 20000, 50000, 100000];
  const currentLevel = userProgress.level;
  const currentLevelXP = levels[currentLevel - 1] || 0;
  const nextLevelXP = levels[currentLevel] || 100000;

  const xpProgress =
    ((userProgress.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

  setTimeout(() => {
    document.getElementById("xpBar").style.width =
      `${Math.min(xpProgress, 100)}%`;
    document.getElementById("xpText").textContent =
      `${userProgress.xp} / ${nextLevelXP} XP`;
  }, 300);
}

let lastQuestion = "";

// ===== CHATBOT =====
function initChatbot() {
  const toggle = document.getElementById("chatbotToggle");
  const windowEl = document.getElementById("chatbotWindow");
  const close = document.getElementById("chatbotClose");
  const input = document.getElementById("chatbotInput");
  const send = document.getElementById("chatbotSend");
  const quickQs = document.querySelectorAll(".quick-q");

  if (!toggle || !windowEl || !close || !input || !send) return;

  // Inject Doubt Generator toggle switch dynamically into header
  const header = windowEl.querySelector(".chatbot-header");
  if (header && !document.getElementById("doubtGenToggle")) {
    if (!document.getElementById("doubt-gen-styles")) {
      const styleEl = document.createElement("style");
      styleEl.id = "doubt-gen-styles";
      styleEl.textContent = `
        .doubt-gen-toggle-container {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: auto;
          margin-right: 12px;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
          user-select: none;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px 8px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .doubt-gen-toggle-container span {
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .doubt-gen-switch {
          position: relative;
          display: inline-block;
          width: 32px;
          height: 18px;
        }
        .doubt-gen-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .doubt-gen-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.15);
          transition: .3s ease;
          border-radius: 34px;
        }
        .doubt-gen-slider:before {
          position: absolute;
          content: "";
          height: 12px;
          width: 12px;
          left: 3px;
          bottom: 3px;
          background-color: #fff;
          transition: .3s ease;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.4);
        }
        .doubt-gen-switch input:checked + .doubt-gen-slider {
          background-color: var(--primary, #8b5cf6);
          box-shadow: 0 0 8px rgba(139, 92, 246, 0.5);
        }
        .doubt-gen-switch input:checked + .doubt-gen-slider:before {
          transform: translateX(14px);
        }
      `;
      document.head.appendChild(styleEl);
    }

    const toggleContainer = document.createElement("div");
    toggleContainer.className = "doubt-gen-toggle-container";
    toggleContainer.innerHTML = `
      <span>Doubt Gen</span>
      <label class="doubt-gen-switch">
        <input type="checkbox" id="doubtGenToggle" aria-label="Toggle self-debugging doubt generator mode">
        <span class="doubt-gen-slider"></span>
      </label>
    `;
    header.insertBefore(toggleContainer, close);

    const toggleInput = document.getElementById("doubtGenToggle");
    const headerTitle = header.querySelector("h4");
    if (toggleInput && headerTitle) {
      toggleInput.addEventListener("change", () => {
        if (toggleInput.checked) {
          headerTitle.textContent = "Doubt Generator";
          showNotification("Self-Debugging Mode Activated! Ask questions to get guided debugging hints.", "success");
          addChatMessage(
            `<div style="font-size: 0.85rem; color: #a7f3d0; background: rgba(16, 185, 129, 0.1); border: 1px dashed #10b981; padding: 8px 12px; border-radius: 8px; margin-bottom: 5px;">
              🔍 <strong>Doubt Generator Enabled</strong><br>
              Instead of giving you code solutions, I will ask reflective Socratic questions to help you spot and fix bugs yourself!
             </div>`,
            "bot",
            { html: true }
          );
        } else {
          headerTitle.textContent = "Algo Assistant";
          showNotification("Standard Algo Assistant Mode Activated.", "info");
          addChatMessage(
            `<div style="font-size: 0.85rem; color: #c084fc; background: rgba(139, 92, 246, 0.1); border: 1px dashed #a855f7; padding: 8px 12px; border-radius: 8px; margin-bottom: 5px;">
              💡 <strong>Standard Assistant Enabled</strong><br>
              I will now provide direct code templates, algorithm explanations, and time/space complexity analysis!
             </div>`,
            "bot",
            { html: true }
          );
        }
      });
    }
  }

  toggle.addEventListener("click", () => {
    windowEl.classList.toggle("hidden");
    const badge = toggle.querySelector(".chatbot-badge");
    if (badge) badge.style.display = "none";
  });

  close.addEventListener("click", () => {
    windowEl.classList.add("hidden");
  });

  function sendMessage() {
    const message = input.value.trim();
    if (!message) return;

    // Add user message
     addChatMessage(message, "user");

    // Store previous question
    lastQuestion = message;

    // Clear input
    input.value = "";

    // Loading indicator
    const loadingEl = document.createElement("div");
    loadingEl.className = "message bot loading";

    loadingEl.innerHTML = `
    <p>⏳ Algo Assistant is typing...</p>
  `;

    const messagesContainer = document.getElementById("chatbotMessages");

    messagesContainer.appendChild(loadingEl);

    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: "smooth",
    });

    // Simulate bot response
    setTimeout(() => {
      // Remove loading
      loadingEl.remove();

      // Generate response
      const response = getBotResponse(message);

      // Add bot response
      addChatMessage(response, "bot", { html: true });
    }, 1000);
  }

  send.addEventListener("click", sendMessage);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  quickQs.forEach((btn) => {
    btn.addEventListener("click", () => {
      const question = btn.getAttribute("data-question");
      input.value = question;
      sendMessage();
    });
  });
}

function addChatMessage(message, sender, { html = false } = {}) {
  const messagesContainer = document.getElementById("chatbotMessages");
  const messageEl = document.createElement("div");
  messageEl.className = `message ${sender}`;
  if (html) {
    messageEl.innerHTML = message;
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
    let category = "General";
    let doubtQuestion = "";
    let debuggingTip = "";

    // Code snippet detection
    const isCode = q.includes("{") || q.includes("}") || q.includes("function") || q.includes("def ") || q.includes("for(") || q.includes("while(") || q.includes("let ") || q.includes("const ") || q.includes("var ");

    if (isCode) {
      category = "Code Analysis";
      doubtQuestion = "Look closely at your loop/recursion variables. Are they guaranteed to change in every iteration to meet the termination condition, or is there a path that leads to an infinite loop?";
      debuggingTip = "Trace the value of your loop counters or recursive inputs for the first 3 iterations. Do they move closer to the base/termination case?";
    } else if (q.includes("sort") || q.includes("bubble") || q.includes("selection") || q.includes("insertion") || q.includes("merge") || q.includes("quick") || q.includes("heap") || q.includes("swap")) {
      category = "Sorting Algorithms";
      doubtQuestion = "What happens to equal elements during comparisons? Is your sorting condition preserving their relative order (stable), or could it swap them unnecessarily?";
      debuggingTip = "Dry-run your sorting condition with a small, duplicate array (e.g., `[2, 2, 1]`) and check if it swaps duplicate elements.";
    } else if (q.includes("recursion") || q.includes("recursive") || q.includes("fibonacci") || q.includes("factorial") || q.includes("backtrack") || q.includes("stack overflow")) {
      category = "Recursion & Call Stack";
      doubtQuestion = "Is your recursion guaranteed to reach the base case? What happens with negative, extremely large, or empty inputs?";
      debuggingTip = "Add console logs at the very top of your function to print the input values. This lets you trace the sequence of recursive calls.";
    } else if (q.includes("dp") || q.includes("dynamic programming") || q.includes("memoization") || q.includes("tabulation") || q.includes("knapsack") || q.includes("lcs") || q.includes("coin change")) {
      category = "Dynamic Programming";
      doubtQuestion = "How are you defining your subproblem states? Are the base cases of your DP array/table correctly initialized before you start filling it?";
      debuggingTip = "Draw a small DP table on paper and fill in the first 3 cells manually. Does your transition equation yield the correct values?";
    } else if (q.includes("tree") || q.includes("bst") || q.includes("graph") || q.includes("node") || q.includes("edge") || q.includes("cycle") || q.includes("bfs") || q.includes("dfs") || q.includes("dijkstra")) {
      category = "Trees & Graphs";
      doubtQuestion = "Does your traversal check for cycles or visited nodes? What happens if you run this on a graph with disconnected components or a tree with a null root?";
      debuggingTip = "Verify that you have initialized a 'visited' set/array to track processed nodes, and verify if root/null checks are at the very beginning.";
    } else if (q.includes("array") || q.includes("list") || q.includes("index") || q.includes("bounds") || q.includes("empty") || q.includes("null") || q.includes("out of bounds") || q.includes("pointer")) {
      category = "Arrays & Memory Bounds";
      doubtQuestion = "What happens if the input is empty or has only one element? Are your loop boundaries (e.g., i < length vs i <= length) safe from off-by-one errors?";
      debuggingTip = "Manually check the index calculation on the last iteration. Does it access an index equal to the array's length?";
    } else {
      category = "General Self-Debugging";
      doubtQuestion = "What are the exact inputs and outputs you expect? Have you dry-run the logic step-by-step with a pencil and paper?";
      debuggingTip = "Try explaining your algorithm line-by-line to a 'rubber duck' or writing the steps in simple English comments first.";
    }

    return `
      <div class="assistant-response doubt-gen-response">
        <h4 style="color: var(--accent, #a78bfa);"><i class="fas fa-question-circle"></i> Doubt Generator Mode</h4>
        
        <div class="response-section" style="margin-top: 8px;">
          <strong>Category:</strong> <span class="category-badge" style="background: rgba(139, 92, 246, 0.2); border: 1px solid rgba(139, 92, 246, 0.3); padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; color: #c084fc;">${category}</span>
        </div>
        
        <div class="response-section" style="margin-top: 12px; border-left: 3px solid var(--primary, #8b5cf6); padding-left: 10px;">
          <h5 style="margin: 0 0 4px 0; font-size: 0.9rem; color: var(--accent, #a78bfa);">🔍 Socratic Question:</h5>
          <p class="socratic-question" style="font-style: italic; color: #f1f5f9; margin: 0; line-height: 1.4;">
            "${doubtQuestion}"
          </p>
        </div>

        <div class="response-section" style="margin-top: 14px; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); padding: 8px 12px; border-radius: 6px;">
          <h5 style="margin: 0 0 4px 0; font-size: 0.9rem; color: #10b981;">🛠️ Debugging Tip:</h5>
          <p style="margin: 0; font-size: 0.85rem; line-height: 1.4; color: #cbd5e1;">${debuggingTip}</p>
        </div>

        <div class="response-section" style="margin-top: 14px; font-size: 0.75rem; color: var(--text-muted, #94a3b8); border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 8px;">
          <i class="fas fa-info-circle"></i> <em>Answer the question above to locate the bug. Turn off "Doubt Gen" in the header to get direct solutions.</em>
        </div>
      </div>
    `;
  }

  let response = chatbotResponses["default"];

  for (const key in chatbotResponses) {
    if (q.includes(key)) {
      response = chatbotResponses[key];
      break;
    }
  }

  const cpType = userProgress.codingPersonality ? userProgress.codingPersonality.type : "brute-force first";
  let personalityHint = "";
  if (cpType === "brute-force first") {
    personalityHint = `
      <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-left: 3px solid #ef4444; padding: 8px 12px; border-radius: 6px; margin-top: 15px; font-size: 0.8rem; line-height: 1.4; color: #f87171;">
        ⚠️ <strong>Behavior Tip (Brute-Force First)</strong>: Remember to write down edge checks (like empty/null inputs) before typing logic loops!
      </div>
    `;
  } else if (cpType === "over-optimizer") {
    personalityHint = `
      <div style="background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.2); border-left: 3px solid #a855f7; padding: 8px 12px; border-radius: 6px; margin-top: 15px; font-size: 0.8rem; line-height: 1.4; color: #c084fc;">
        ⚡ <strong>Behavior Tip (Over-Optimizer)</strong>: Focus on clean code readability and verify if the performance gain warrants complex structures.
      </div>
    `;
  } else if (cpType === "slow but accurate") {
    personalityHint = `
      <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.2); border-left: 3px solid #3b82f6; padding: 8px 12px; border-radius: 6px; margin-top: 15px; font-size: 0.8rem; line-height: 1.4; color: #60a5fa;">
        ⏱️ <strong>Behavior Tip (Slow but Accurate)</strong>: You write correct code! Try setting a timer for 15 minutes to practice coding under pressure.
      </div>
    `;
  } else if (cpType === "greedy thinker") {
    personalityHint = `
      <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); border-left: 3px solid #10b981; padding: 8px 12px; border-radius: 6px; margin-top: 15px; font-size: 0.8rem; line-height: 1.4; color: #34d399;">
        🎯 <strong>Behavior Tip (Greedy Thinker)</strong>: Ensure a greedy choice guarantees a global optimum before finalizing your algorithm.
      </div>
    `;
  }

  return `
    <div class="assistant-response">
      <h4>🧠 Problem Understanding</h4>
      <p>${escapeHtml(question)}</p>

      <h4>⚡ Approach</h4>
      <p>${response}</p>

      <h4>💻 Code Solution</h4>
      <pre><code>
// Example Template
function solveProblem() {
   // Your logic here
}
      </code></pre>

      <h4>📊 Complexity Analysis</h4>
      <p>Time Complexity: O(n)</p>
      <p>Space Complexity: O(1)</p>
      
      ${personalityHint}
    </div>
  `;
}

// ===== SCROLL EFFECTS =====
function initScrollEffects() {
  const scrollTopBtn = document.getElementById("scrollTopBtn");
  const backToTopBtn = document.getElementById("backToTopBtn");

  // Ensure missing elements don't break the rest of the page scripts.
  const hasScrollTopBtn = !!scrollTopBtn;
  const hasBackToTopBtn = !!backToTopBtn;

  const setVisibleState = () => {
    const shouldShow = window.scrollY > 500;

    if (hasScrollTopBtn) {
      scrollTopBtn.classList.toggle("visible", shouldShow);
    }

    // CSS for back-to-top uses .show
    if (hasBackToTopBtn) {
      backToTopBtn.classList.toggle("show", shouldShow);
    }
  };

  window.addEventListener("scroll", setVisibleState);
  setVisibleState();

  if (hasScrollTopBtn) {
    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (hasBackToTopBtn) {
    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Intersection Observer for animations
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in");
        }
      });
    },
    { threshold: 0.1 },
  );

  document
    .querySelectorAll(
      ".topic-card, .problem-card, .interview-card, .dashboard-card",
    )
    .forEach((el) => {
      observer.observe(el);
    });
}

// ===== UTILITIES =====
function initializeAnimations() {
  // Animate elements on scroll using Intersection Observer
  const animatedElements = document.querySelectorAll(".animate-in");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    },
    { threshold: 0.1 },
  );

  animatedElements.forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(30px)";
    el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    observer.observe(el);
  });
}

function getDaysDifference(date1, date2) {
  const d1 = new Date(date1);
  d1.setHours(0, 0, 0, 0);
  const d2 = new Date(date2);
  d2.setHours(0, 0, 0, 0);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

// ===== LOCAL STORAGE =====
function saveUserData() {
  try {
    userProgress.lastActive = new Date().toISOString();
    localStorage.setItem("algoInfinityVerse", JSON.stringify(userProgress));
    queueProgressSync();
  } catch (error) {
    console.warn("Could not save user data to localStorage:", error);
  }
}

let cachedSession = null;
let leaderboardRequestId = 0;

// Leaderboard UI config
const LEADERBOARD_LIMIT = 10;

let progressSyncInFlight = null;
let pendingProgressSync = false;
let progressSyncTimer = null;


function queueProgressSync() {
  if (location.protocol === "file:") return;
  clearTimeout(progressSyncTimer);
  progressSyncTimer = setTimeout(syncUserProgress, 600);
}

async function syncUserProgress() {
  if (progressSyncInFlight) {
    pendingProgressSync = true;
    return progressSyncInFlight;
  }

  const session = await getAuthenticatedSession();
  if (!session?.authenticated) return;

  const payload = {
    name: userProgress.name,
    xp: userProgress.xp,
    level: userProgress.level,
    avatar: userProgress.avatar,
  };

  progressSyncInFlight = (async () => {
    try {
      const response = await fetch("/api/progress", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Progress sync failed.");
      updateLeaderboard();
    } catch (error) {
      console.warn("Could not sync user progress:", error);
    } finally {
      progressSyncInFlight = null;
      if (pendingProgressSync) {
        pendingProgressSync = false;
        queueProgressSync();
      }
    }
  })();

  return progressSyncInFlight;
}


async function getAuthenticatedSession() {
  if (window.algoAuth) {
    cachedSession = window.algoAuth;
    return cachedSession;
  }
  if (cachedSession) return cachedSession;

  try {
    const response = await fetch("/api/session", { credentials: "include" });
    cachedSession = response.ok ? await response.json() : { authenticated: false, user: null };
  } catch {
    cachedSession = { authenticated: false, user: null };
  }

  return cachedSession;
}

function loadUserData() {
    try {
        const saved = localStorage.getItem("algoInfinityVerse");
        if (saved) {
            const data = JSON.parse(saved);
            userProgress = {
                ...userProgress,
                ...data
            };
            if (!userProgress.quizScores) {
                userProgress.quizScores = {};
            }
            if (!userProgress.completedRoadmapSteps) {
                userProgress.completedRoadmapSteps = [];
            }
            if (!userProgress.activityData) {
                userProgress.activityData = {};
            }
            // Ensure codingPersonality exists
            if (!userProgress.codingPersonality) {
                userProgress.codingPersonality = {
                    type: "brute-force first",
                    bruteForceCount: 1,
                    slowAccurateCount: 0,
                    greedyCount: 0,
                    overOptimizerCount: 0
                };
            }
            // Ensure mistakeDna exists
            if (!userProgress.mistakeDna) {
                userProgress.mistakeDna = {
                    offByOneCount: 0,
                    recursionBaseCaseCount: 0,
                    wrongLogicCount: 0,
                    recentLogs: []
                };
            }
            backfillActivityData();
        } else {
            userProgress.name = "Learner";
            userProgress.avatar = "🚀";
            userProgress.completedProblems = [1,2,10];
            userProgress.xp = 350;
            userProgress.level = 2;
            userProgress.streak = 3;
            userProgress.badges = [1];
            userProgress.quizScores = {};
            userProgress.activityData = {};
            userProgress.codingPersonality = {
                type: "brute-force first",
                bruteForceCount: 1,
                slowAccurateCount: 0,
                greedyCount: 0,
                overOptimizerCount: 0
            };
            userProgress.mistakeDna = {
                offByOneCount: 0,
                recursionBaseCaseCount: 0,
                wrongLogicCount: 0,
                recentLogs: []
            };
            saveUserData();
        }
    } catch(error) {
        console.error("Error loading user data:", error);
        userProgress = {
            name:"Learner",
            avatar:"🚀",
            completedProblems:[],
            xp:0,
            level:1,
            streak:0,
            badges:[],
            lastActive:null,
            quizScores:{},
            activityData:{},
            codingPersonality: {
                type: "brute-force first",
                bruteForceCount: 1,
                slowAccurateCount: 0,
                greedyCount: 0,
                overOptimizerCount: 0
            },
            mistakeDna: {
                offByOneCount: 0,
                recursionBaseCaseCount: 0,
                wrongLogicCount: 0,
                recentLogs: []
            }
        };
        saveUserData();
    }

    updateProfile();

    getAuthenticatedSession()
    .then(session=>{
        if(
          session &&
          session.user &&
          session.user.name
        ){
            userProgress.name = session.user.name;
            updateProfile();
            saveUserData();
        }
        initProfile();
    });
}

// ===== QUIZ EDITOR =====
// currentProblem declared near the top-level to avoid TDZ issues.

// currentNotesProblemId is already declared earlier; do not redeclare it here.

function openTopicModal(topic) {
  const modal = document.getElementById("topicModal");
  let selectedProblemName = null; // track selected problem

  document.getElementById("modalTitle").textContent = topic.name;
document.getElementById("modalTheory").innerHTML = topic.theory;
  document.getElementById("modalDifficulty").innerHTML =
    `<span class="difficulty-badge ${getDifficultyClass(topic.difficulty)}">${topic.difficulty}</span>`;

  const problemsList = document.getElementById("modalProblems");
  problemsList.innerHTML = topic.problems
    .map((p) => `<li class="sample-problem-item" 
      style="cursor:pointer; padding: 0.6rem 1rem; margin: 0.4rem 0; border-radius: 8px; border: 1px solid var(--glass-border); list-style: none; transition: all 0.2s ease;" 
      onmouseover="this.style.background='var(--primary)'; this.style.color='var(--dark-bg)'"
      onmouseout="if(!this.classList.contains('selected-problem')){this.style.background=''; this.style.color='';}"
      onclick="selectSampleProblem(this, '${p}')">${p}</li>`)
    .join("");

  // Update Start Practicing button
  const startBtn = document.getElementById("startPracticeBtn");
  startBtn.textContent = "Start Practicing";
  startBtn.onclick = () => {
    const selected = document.querySelector(".selected-problem");
    const problemName = selected ? selected.textContent.trim() : null;

    closeTopicModal();
    document.getElementById("practice").scrollIntoView({ behavior: "smooth" });

    setTimeout(() => {
      const match = practiceProblems.find(
        (p) => p.title.toLowerCase() === (problemName || "").toLowerCase()
      );
      if (match) {
        openQuizEditor(match);
      }
    }, 600);
  };

  modal.classList.add("active");
}
function selectSampleProblem(el, problemName) {
  // Remove selected state from all items
  document.querySelectorAll(".sample-problem-item").forEach((item) => {
    item.classList.remove("selected-problem");
    item.style.background = "";
    item.style.color = "";
    item.style.border = "1px solid var(--glass-border)";
  });

  // Highlight selected item
  el.classList.add("selected-problem");
  el.style.background = "var(--primary)";
  el.style.color = "var(--dark-bg)";
  el.style.border = "1px solid var(--primary)";

  // Update Start Practicing button to show selected problem
  const startBtn = document.getElementById("startPracticeBtn");
  startBtn.textContent = `Start Practicing: ${problemName}`;
}
function closeTopicModal() {
  document.getElementById("topicModal").classList.remove("active");
}

function toggleNotesButton(btn, problemId) {
  const hasNotes = btn.classList.toggle("active");
}

// ===== EDITOR DRAFT LIFECYCLE =====

/**
 * Persist the current editor content for a problem so the user can resume later.
 * @param {number|string} problemId
 * @param {string} code
 */
function saveEditorDraft(problemId, code) {
  try {
    localStorage.setItem(`editorDraft_${problemId}`, code);
  } catch (e) {
    console.warn('Could not save editor draft:', e);
  }
}

/**
 * Read back a previously saved draft, or return null if none exists.
 * @param {number|string} problemId
 * @returns {string|null}
 */
function getEditorDraft(problemId) {
  try {
    return localStorage.getItem(`editorDraft_${problemId}`);
  } catch (e) {
    return null;
  }
}

/**
 * Remove a saved draft after a successful submission / explicit discard.
 * Safe to call even when no draft exists.
 * @param {number|string} problemId
 */
function clearEditorDraft(problemId) {
  try {
    localStorage.removeItem(`editorDraft_${problemId}`);
  } catch (e) {
    console.warn('Could not clear editor draft:', e);
  }
}

function closeQuizEditor() {
  document.getElementById("quizEditorModal").classList.remove("active");
  currentProblem = null;
}

function clearQuizOutput() {
  const output = document.getElementById("quizOutputContent");
  output.innerHTML =
    '<p class="output-placeholder">Run your code to see output...</p>';
}

function runQuizCode() {
  const editor = document.getElementById("codeEditor");
  const code = editor.value;
  const lang = document.getElementById("languageSelect").value;
  const output = document.getElementById("quizOutputContent");

  if (!code.trim()) {
    output.innerHTML =
      '<p class="output-error">❌ Error: Please write some code first.</p>';
    return;
  }

  output.innerHTML = '<p class="output-running">⏳ Running code...</p>';

  // Simulate code execution
  setTimeout(() => {
    try {
      const result = executeCode(code, lang);
      output.innerHTML = `<pre class="output-success">✅ Output:\n${result}</pre>`;
    } catch (e) {
      output.innerHTML = `<pre class="output-error">❌ Error:\n${e.message}</pre>`;
    }
  }, 500);
}

function submitQuizCode() {
  const editor = document.getElementById("codeEditor");
  const code = editor.value;

  if (!code.trim()) {
    showNotification("Please write some code before submitting!", "error");
    return;
  }

  if (!currentProblem) {
    showNotification("No problem selected!", "error");
    return;
  }

  // Check if already completed
  if (userProgress.completedProblems.includes(currentProblem.id)) {
    showNotification("You have already completed this problem!", "info");
    return;
  }

  // Mark as completed
  userProgress.completedProblems.push(currentProblem.id);
  const difficulty = currentProblem.difficulty; // Store difficulty before closing editor
  addXP(getXPForDifficulty(difficulty));
  updateStreak();
  recordDailyActivity(1);
  saveUserData();

  // Update UI
  updateDashboard();
  updateGamification();
  initRoadmap();
  initTopicsSection();
  renderActivityHeatmap();

  // Tear down the editor first, then clear the draft so it is only removed
  // after the save/teardown flow has fully completed.
  const submittedProblemId = currentProblem.id;
  closeQuizEditor();
  clearEditorDraft(submittedProblemId);

  showNotification(
    `🎉 Problem solved! +${getXPForDifficulty(difficulty)} XP`,
    "success",
  );
}

function generateExamples(problem) {
  const examples = {
    1: `<strong>Example 1:</strong><br>Input: nums = [2,7,11,15], target = 9<br>Output: [0,1]<br>Explanation: nums[0] + nums[1] = 2 + 7 = 9<br><br>
        <strong>Example 2:</strong><br>Input: nums = [3,2,4], target = 6<br>Output: [1,2]<br>Explanation: nums[1] + nums[2] = 2 + 4 = 6<br><br>
        <strong>Example 3:</strong><br>Input: nums = [3,3], target = 6<br>Output: [0,1]<br><br>
        <strong>Edge Cases:</strong><br>• What if the array has duplicates?<br>• What if target is negative?<br><br>
        <strong>Follow-up:</strong> Can you solve it in O(n) using a Hash Map?`,

    2: `<strong>Example 1:</strong><br>Input: s = "()"<br>Output: true<br><br>
        <strong>Example 2:</strong><br>Input: s = "()[]{}"<br>Output: true<br><br>
        <strong>Example 3:</strong><br>Input: s = "(]"<br>Output: false<br>Explanation: Brackets are not closed in the correct order.<br><br>
        <strong>Edge Cases:</strong><br>• Empty string → true<br>• Odd length string → always false<br><br>
        <strong>Follow-up:</strong> Can you solve it in O(n) time using a Stack?`,

    3: `<strong>Example 1:</strong><br>Input: l1 = [1,2,4], l2 = [1,3,4]<br>Output: [1,1,2,3,4,4]<br><br>
        <strong>Example 2:</strong><br>Input: l1 = [], l2 = []<br>Output: []<br><br>
        <strong>Example 3:</strong><br>Input: l1 = [], l2 = [0]<br>Output: [0]<br><br>
        <strong>Edge Cases:</strong><br>• One or both lists are empty<br>• Lists of different lengths<br><br>
        <strong>Follow-up:</strong> Can you solve it both iteratively and recursively?`,

    4: `<strong>Example 1:</strong><br>Input: nums = [-2,1,-3,4,-1,2,1,-5,4]<br>Output: 6<br>Explanation: [4,-1,2,1] has the largest sum = 6<br><br>
        <strong>Example 2:</strong><br>Input: nums = [1]<br>Output: 1<br><br>
        <strong>Example 3:</strong><br>Input: nums = [5,4,-1,7,8]<br>Output: 23<br><br>
        <strong>Edge Cases:</strong><br>• All negative numbers → return the largest single element<br><br>
        <strong>Follow-up:</strong> Can you solve it using Kadane's Algorithm in O(n)?`,

    5: `<strong>Example:</strong><br>LRUCache cache = new LRUCache(2);<br>cache.put(1,1); // cache: {1=1}<br>cache.put(2,2); // cache: {1=1, 2=2}<br>cache.get(1);   // returns 1<br>cache.put(3,3); // evicts key 2, cache: {1=1, 3=3}<br>cache.get(2);   // returns -1 (not found)<br><br>
        <strong>Edge Cases:</strong><br>• Capacity of 1<br>• Getting a key that was just evicted<br><br>
        <strong>Follow-up:</strong> Can you achieve O(1) for both get and put using a HashMap + Doubly Linked List?`,

    6: `<strong>Example 1:</strong><br>Input: adjList = [[2,4],[1,3],[2,4],[1,3]]<br>Output: [[2,4],[1,3],[2,4],[1,3]]<br><br>
        <strong>Example 2:</strong><br>Input: adjList = [[]]<br>Output: [[]]<br><br>
        <strong>Edge Cases:</strong><br>• Empty graph<br>• Single node with no neighbors<br><br>
        <strong>Follow-up:</strong> Can you solve it using both BFS and DFS?`,

    7: `<strong>Example 1:</strong><br>Input: nums = [10,9,2,5,3,7,101,18]<br>Output: 4<br>Explanation: [2,3,7,101] is the longest increasing subsequence<br><br>
        <strong>Example 2:</strong><br>Input: nums = [0,1,0,3,2,3]<br>Output: 4<br><br>
        <strong>Edge Cases:</strong><br>• All elements same → LIS = 1<br>• Already sorted → LIS = n<br><br>
        <strong>Follow-up:</strong> Can you improve from O(n²) DP to O(n log n) using Binary Search?`,

    8: `<strong>Example 1:</strong><br>Input: beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]<br>Output: 5<br>Explanation: hit→hot→dot→dog→cog<br><br>
        <strong>Example 2:</strong><br>Input: beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log"]<br>Output: 0<br>Explanation: endWord not in wordList<br><br>
        <strong>Follow-up:</strong> Can you find ALL shortest transformation sequences?`,

    9: `<strong>Example 1:</strong><br>Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]<br>Output: 6<br><br>
        <strong>Example 2:</strong><br>Input: height = [4,2,0,3,2,5]<br>Output: 9<br><br>
        <strong>Edge Cases:</strong><br>• All same height → 0 water<br>• Monotonically increasing/decreasing → 0 water<br><br>
        <strong>Follow-up:</strong> Can you solve it in O(n) time and O(1) space using Two Pointers?`,

    10: `<strong>Example 1:</strong><br>Input: head = [1,2,3,4,5]<br>Output: [5,4,3,2,1]<br><br>
        <strong>Example 2:</strong><br>Input: head = [1,2]<br>Output: [2,1]<br><br>
        <strong>Edge Cases:</strong><br>• Empty list → null<br>• Single node → same node<br><br>
        <strong>Follow-up:</strong> Can you solve it both iteratively and recursively?`,

    11: `<strong>Example 1:</strong><br>Input: root = [4,2,7,1,3,6,9]<br>Output: [4,7,2,9,6,3,1]<br><br>
        <strong>Example 2:</strong><br>Input: root = [2,1,3]<br>Output: [2,3,1]<br><br>
        <strong>Edge Cases:</strong><br>• Empty tree → null<br>• Single node → same node<br><br>
        <strong>Follow-up:</strong> Can you solve it both recursively and iteratively?`,

    12: `<strong>Example 1:</strong><br>Input: root = [2,1,3]<br>Output: true<br><br>
        <strong>Example 2:</strong><br>Input: root = [5,1,4,null,null,3,6]<br>Output: false<br>Explanation: Root's right child value 4 is not greater than root 5<br><br>
        <strong>Edge Cases:</strong><br>• Empty tree → true<br>• Duplicate values → false<br><br>
        <strong>Follow-up:</strong> Can you solve it without recursion using Morris Traversal?`,

    13: `<strong>Example 1:</strong><br>Input: grid = [["1","1","0"],["1","1","0"],["0","0","1"]]<br>Output: 2<br><br>
        <strong>Example 2:</strong><br>Input: grid = [["1","1","1"],["0","1","0"],["1","1","1"]]<br>Output: 1<br><br>
        <strong>Edge Cases:</strong><br>• All water → 0<br>• All land → 1<br><br>
        <strong>Follow-up:</strong> Can you solve it using both DFS and Union-Find?`,

    14: `<strong>Example 1:</strong><br>Input: nums = [1,2,3,1]<br>Output: 4<br>Explanation: Rob house 1 (1) then house 3 (3)<br><br>
        <strong>Example 2:</strong><br>Input: nums = [2,7,9,3,1]<br>Output: 12<br>Explanation: Rob house 1 (2), house 3 (9), house 5 (1)<br><br>
        <strong>Edge Cases:</strong><br>• Single house → rob it<br>• Two houses → rob the larger<br><br>
        <strong>Follow-up:</strong> What if houses are arranged in a circle? (House Robber II)`,

    15: `<strong>Example 1:</strong><br>Input: numCourses = 2, prerequisites = [[1,0]]<br>Output: true<br>Explanation: Take course 0 first, then course 1<br><br>
        <strong>Example 2:</strong><br>Input: numCourses = 2, prerequisites = [[1,0],[0,1]]<br>Output: false<br>Explanation: Cycle detected — impossible to finish<br><br>
        <strong>Edge Cases:</strong><br>• No prerequisites → always true<br>• Self-loop → false<br><br>
        <strong>Follow-up:</strong> Can you return the actual course order? (Course Schedule II)`,

    16: `<strong>Example 1:</strong><br>Input: prices = [7,1,5,3,6,4]<br>Output: 5<br>Explanation: Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6 − 1 = 5.<br><br>
        <strong>Example 2:</strong><br>Input: prices = [7,6,4,3,1]<br>Output: 0<br>Explanation: Prices only decrease — no profitable transaction is possible.<br><br>
        <strong>Example 3:</strong><br>Input: prices = [2,4,1]<br>Output: 2<br>Explanation: Buy on day 1 (price = 2) and sell on day 2 (price = 4), profit = 2.<br><br>
        <strong>Edge Cases:</strong><br>• Single element → 0 (can't sell)<br>• All same prices → 0<br>• Minimum at the very end → 0<br><br>
        <strong>Follow-up:</strong> Can you solve it in O(n) time and O(1) space using a greedy approach (track the minimum price so far)?`,

    17: `<strong>Example 1:</strong><br>Input: nums = [0,1,0,3,12]<br>Output: [1,3,12,0,0]<br>Explanation: All non-zero elements keep their relative order and zeroes move to the end.<br><br>
        <strong>Example 2:</strong><br>Input: nums = [0]<br>Output: [0]<br><br>
        <strong>Example 3:</strong><br>Input: nums = [1,2,3]<br>Output: [1,2,3]<br>Explanation: No zeroes — array is unchanged.<br><br>
        <strong>Edge Cases:</strong><br>• All zeroes → same array<br>• No zeroes → unchanged<br>• Single element → unchanged<br><br>
        <strong>Follow-up:</strong> Can you do it with a single pass using the two-pointer technique to minimize writes?`,

    18: `<strong>Example 1:</strong><br>Input: s = "anagram", t = "nagaram"<br>Output: true<br>Explanation: Both strings contain the same characters with the same frequencies.<br><br>
        <strong>Example 2:</strong><br>Input: s = "rat", t = "car"<br>Output: false<br>Explanation: 'r','a','t' vs 'c','a','r' — different character sets.<br><br>
        <strong>Example 3:</strong><br>Input: s = "a", t = "a"<br>Output: true<br><br>
        <strong>Edge Cases:</strong><br>• Different lengths → always false<br>• Single character strings<br>• Strings with repeated characters<br><br>
        <strong>Follow-up:</strong> Can you solve it in O(n) using a Hash Map instead of sorting?`,
        
    19: `<strong>Example 1:</strong><br>Input: nums = [2,2,1]<br>Output: 1<br>Explanation: 1 appears only once while 2 appears twice.<br><br>
        <strong>Example 2:</strong><br>Input: nums = [4,1,2,1,2]<br>Output: 4<br>Explanation: 4 appears only once; 1 and 2 each appear twice.<br><br>
        <strong>Example 3:</strong><br>Input: nums = [1]<br>Output: 1<br>Explanation: Only one element — it is the single number by default.<br><br>
        <strong>Edge Cases:</strong><br>• Single element array → return that element<br>• Large arrays with the unique element at start/middle/end<br>• Negative numbers — XOR works on negative integers too<br><br>
        <strong>Key Insight (XOR):</strong><br>• a XOR a = 0 (same numbers cancel out)<br>• a XOR 0 = a (any number XOR 0 is itself)<br>• XOR all elements together → duplicates cancel, leaving the single number<br><br>
        <strong>Follow-up:</strong> Can you solve it in O(n) time and O(1) space using XOR instead of a Hash Map?`,
    20: `<strong>Example 1:</strong><br>Input: nums1 = [1,2,2,1], nums2 = [2,2]<br>Output: [2]<br>Explanation: 2 is the only element present in both arrays; duplicates are ignored.<br><br>
        <strong>Example 2:</strong><br>Input: nums1 = [4,9,5], nums2 = [9,4,9,8,4]<br>Output: [4,9]<br>Explanation: Both 4 and 9 appear in both arrays. Order does not matter.<br><br>
        <strong>Example 3:</strong><br>Input: nums1 = [1,2,3], nums2 = [4,5,6]<br>Output: []<br>Explanation: No common elements — result is an empty array.<br><br>
        <strong>Edge Cases:</strong><br>• No common elements → return []<br>• All elements in common → return unique elements of either array<br>• One array is empty → return []<br>• Both arrays identical → return unique elements of the array<br><br>
        <strong>Key Insight (Hash Set):</strong><br>• Convert nums1 into a Set for O(1) lookups<br>• Iterate nums2 and check membership in the Set<br>• Store matches in a result Set to avoid duplicates<br><br>
        <strong>Follow-up:</strong> Can you solve it in O(n + m) time using two Hash Sets? What changes if both arrays are pre-sorted?`,
    21: `<strong>Example 1:</strong><br>Input: nums = [1,2,3,4]<br>Output: true<br>Explanation: The array is sorted in non-decreasing order: 1 ≤ 2 ≤ 3 ≤ 4.<br><br>
        <strong>Example 2:</strong><br>Input: nums = [5,4,3,2,1]<br>Output: false<br>Explanation: The array is not sorted.<br><br>
        <strong>Example 3:</strong><br>Input: nums = [1,1,2,2,3]<br>Output: true<br>Explanation: The array is sorted (duplicates are allowed and still sorted).<br><br>
        <strong>Edge Cases:</strong><br>• Empty array or single element array → true by default<br>• Negative values<br><br>
        <strong>Follow-up:</strong> Can you solve it in a single pass with O(n) time and O(1) space?`,
    22: `<strong>Example 1:</strong><br>Input: n = 2<br>Output: 1<br>Explanation: F(2) = F(1) + F(0) = 1 + 0 = 1.<br><br>
        <strong>Example 2:</strong><br>Input: n = 3<br>Output: 2<br>Explanation: F(3) = F(2) + F(1) = 1 + 1 = 2.<br><br>
        <strong>Example 3:</strong><br>Input: n = 4<br>Output: 3<br>Explanation: F(4) = F(3) + F(2) = 2 + 1 = 3.<br><br>
        <strong>Example 4:</strong><br>Input: n = 5<br>Output: 5<br>Explanation: F(5) = F(4) + F(3) = 3 + 2 = 5.<br><br>
        <strong>Edge Cases:</strong><br>• F(0) = 0, F(1) = 1 (base cases)<br>• Large values of n<br><br>
        <strong>Follow-up:</strong> Can you solve it in O(n) time and O(1) space using bottom-up tabulation?`,
  };
  return (
    examples[problem.id] || "<strong>Example:</strong><br>Solve this problem"
  );
}

function generateTestCases(problem) {
  if (problem.id === 21) {
    return [
      { input: "nums = [1, 2, 3, 4]", expected: "true", passed: true },
      { input: "nums = [5, 4, 3, 2, 1]", expected: "false", passed: true },
      { input: "nums = [1, 1, 2, 2, 3]", expected: "true", passed: true },
    ];
  }
  if (problem.id === 22) {
    return [
      { input: "n = 2", expected: "1", passed: true },
      { input: "n = 3", expected: "2", passed: true },
      { input: "n = 5", expected: "5", passed: true },
    ];
  }
  return [
    { input: "Test input 1", expected: "Expected output", passed: true },
    { input: "Test input 2", expected: "Expected output", passed: true },
    { input: "Test input 3", expected: "Expected output", passed: false },
  ];
}

function renderTestCases(testCases) {
  const container = document.getElementById("quizTestCasesContainer");
  container.innerHTML = testCases
    .map(
      (tc) => `
        <div class="test-case">
            <span class="test-case-input">${tc.input}</span>
            <span class="test-case-result ${tc.passed ? "passed" : "failed"}">
                ${tc.passed ? "✓ PASS" : "✗ FAIL"}
            </span>
        </div>
    `,
    )
    .join("");
}

function openQuizEditor(problem) {
  currentProblem = problem;
  const modal = document.getElementById("quizEditorModal");

  document.getElementById("quizTitle").textContent = problem.title;
  document.getElementById("quizTopicBadge").textContent =
    problem.tags.join(", ");
  document.getElementById("quizDifficulty").textContent = problem.difficulty;
  document.getElementById("quizDifficulty").className =
    "quiz-difficulty " +
    (problem.difficulty === "easy"
      ? "difficulty-easy"
      : problem.difficulty === "medium"
        ? "difficulty-medium"
        : "difficulty-hard");

  const descEl = document.getElementById("quizDescription");
  if (problem.description) {
    let descHTML = problem.description;
    if (problem.constraints) {
      descHTML +=
        "<br><br><strong>Constraints:</strong><br>" +
        problem.constraints.map((c) => `• ${c}`).join("<br>");
    }
    descEl.innerHTML = descHTML;
  } else {
    descEl.textContent =
      'Solve the "' +
      problem.title +
      '" problem. ' +
      problem.tags.map((t) => "[" + t + "]").join(" ");
  }
  const examples = generateExamples(problem);
  document.getElementById("quizExamples").innerHTML = examples;

  const testCases = generateTestCases(problem);
  renderTestCases(testCases);

  const editor = document.getElementById("codeEditor");
  const lang = document.getElementById("languageSelect").value;
  // Restore saved draft if one exists; only fall back to the default template
  // when there is no in-progress draft for this problem.
  const savedDraft = getEditorDraft(problem.id);
  editor.value = savedDraft !== null ? savedDraft : getDefaultCode(lang, problem);
    updateEditorDisplayMode();

  clearQuizOutput();
    
    // Ensure output panel is expanded (not collapsed) when opening editor
    const outputPanel = document.getElementById('outputPanel');
    const outputIcon = document.getElementById('outputToggleIcon');
    if (outputPanel) {
        outputPanel.classList.remove('collapsed');
    }
    if (outputIcon) {
        outputIcon.classList.remove('fa-chevron-up');
        outputIcon.classList.add('fa-chevron-down');
    }

  modal.classList.add("active");

    // Reset scrolls and update editor layout
    editor.scrollTop = 0;
    editor.scrollLeft = 0;
    editor.dispatchEvent(new Event('input'));
  updateLineNumbers();
    syncScroll();
}

function getDefaultCode(lang, problem) {
  const templates = {
    javascript: `/**
 * @param {*} params - Problem parameters
 * @return {*} - Solution result
 */
function solution(params) {
    
    
}

// Test your solution
// console.log(solution());`,
    python: `def solution(params):
    """
    :type params: 
    :rtype: 
    """
    
    

# Test your solution
# print(solution())`,
    java: `class Solution {
    public ReturnType solution(ParamsType params) {
        
    }
}`,
    cpp: `class Solution {
public:
    ReturnType solution(ParamsType params) {
        
    }
};`,
  };
  return templates[lang] || templates.javascript;
}

function executeCode(code, lang) {
  // Simulate code execution based on language
  if (lang === "javascript") {
    // Try to find and execute a function
    const fnMatch = code.match(/function\s+(\w+)/);
    if (fnMatch) {
      return `Executed successfully. Function "${fnMatch[1]}" found.`;
    }
    return "Code executed (simulation).";
  }
  return `Code executed in ${lang.toUpperCase()} (simulation).`;
}

function getXPForDifficulty(difficulty) {
  const xpMap = { easy: 100, medium: 250, hard: 500 };
  return xpMap[difficulty.toLowerCase()] || 100;
}

// ===== ACTIVITY HEATMAP =====
function recordDailyActivity(problemCount = 1) {
  if (!userProgress.activityData) {
    userProgress.activityData = {};
  }
  const today = new Date();
  const dateKey = formatDateKey(today);
  userProgress.activityData[dateKey] = (userProgress.activityData[dateKey] || 0) + problemCount;
}

function backfillActivityData() {
  if (!userProgress.activityData) {
    userProgress.activityData = {};
  }
  const lastActive = userProgress.lastActive
    ? new Date(userProgress.lastActive)
    : null;
  const anchor = lastActive || new Date();
  const total = userProgress.completedProblems.length;

  if (total > 0) {
    const today = new Date();
    let day = new Date(anchor);
    for (let i = 0; i < total; i++) {
      const key = formatDateKey(day);
      if (!userProgress.activityData[key]) {
        userProgress.activityData[key] = 1;
      } else {
        userProgress.activityData[key] += 1;
      }
      day.setDate(day.getDate() - 1);
      if (day > today) {
        day.setDate(today.getDate());
        break;
      }
    }
  }
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function getActivityLevel(count) {
  if (!count || count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

function renderActivityHeatmap() {
  const container = document.getElementById("activityHeatmap");
  if (!container) return;

  const activityData = userProgress.activityData || {};
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // Show 52 weeks (roughly one year) of data
  const WEEKS_TO_SHOW = 52; // 1 year
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  // Start from today, go back WEEKS_TO_SHOW weeks
  // Align to Sunday (start of week)
  const dayOfWeek = today.getDay(); // 0=Sun
  const endDate = new Date(today);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (WEEKS_TO_SHOW * 7 - 1) - dayOfWeek);
  startDate.setHours(0, 0, 0, 0);

  // Collect all dates in range into weeks (columns = weeks, rows = days Sun-Sat)
  const weeks = [];
  const monthLabels = [];
  let currentWeek = [];
  let prevMonth = -1;

  const d = new Date(startDate);
  for (let i = 0; i < WEEKS_TO_SHOW * 7; i++) {
    const dow = d.getDay();
    if (dow === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  // Build month labels
  weeks.forEach((week, wi) => {
    // Use the Thursday of each week to determine the month display
    const thuIdx = Math.min(4, week.length - 1);
    const thuDate = week[thuIdx];
    const month = thuDate.getMonth();
    if (month !== prevMonth) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      monthLabels.push({ weekIndex: wi, label: monthNames[month] });
      prevMonth = month;
    }
  });

  // Weekday labels (Mon, Wed, Fri)
  const weekdayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  let html = "";

  // Month labels row (CSS Grid, columns match the weeks below)
  html += '<div class="heatmap-months-row">';
  monthLabels.forEach((ml) => {
    html += `<span class="heatmap-month-label" style="grid-column:${ml.weekIndex + 2}">${ml.label}</span>`;
  });
  html += "</div>";

  // Grid row: weekday labels + week columns
  html += '<div class="heatmap-grid">';
  html += '<div class="heatmap-weekday-labels">';
  weekdayLabels.forEach((label) => {
    html += `<span class="heatmap-weekday-label">${label}</span>`;
  });
  html += "</div>";

  weeks.forEach((week) => {
    html += '<div class="heatmap-week">';
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      if (dayIdx < week.length) {
        const date = week[dayIdx];
        const dateKey = formatDateKey(date);
        const count = activityData[dateKey] || 0;
        const level = getActivityLevel(count);
        const isFuture = date > today;
        const dateStr = date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const problemLabel = count === 1 ? "problem" : "problems";
        html += `<div
          class="heatmap-day"
          data-level="${isFuture ? -1 : level}"
          data-date="${dateKey}"
          data-count="${count}"
          data-future="${isFuture}"
          title="${dateStr}: ${count} ${problemLabel} solved"
        ></div>`;
      } else {
        html += '<div class="heatmap-day" data-future="true"></div>';
      }
    }
    html += "</div>";
  });
  html += "</div>";

  container.innerHTML = html;

  // Attach hover tooltip handlers
  attachHeatmapTooltips();
}

function positionHeatmapTooltip(e) {
  const tooltip = document.getElementById("heatmapTooltip");
  if (!tooltip) return;

  const padding = 8;
  const offsetX = 14;
  const offsetY = 12;

  // Force a synchronous layout so width/height reflect current content
  const rect = tooltip.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Default: to the right of the cursor, above it
  let left = e.clientX + offsetX;
  let top = e.clientY - rect.height - offsetY;

  // Flip to the left of the cursor if it would overflow the right edge
  if (left + rect.width + padding > vw) {
    left = e.clientX - rect.width - offsetX;
  }

  // Flip below the cursor if it would overflow the top edge
  if (top < padding) {
    top = e.clientY + offsetY;
  }

  // Clamp inside the viewport (left, right, bottom)
  if (left < padding) left = padding;
  if (left + rect.width + padding > vw) left = vw - rect.width - padding;
  if (top + rect.height + padding > vh) top = vh - rect.height - padding;

  tooltip.style.left = left + "px";
  tooltip.style.top = top + "px";
}

function attachHeatmapTooltips() {
  const tooltip = document.getElementById("heatmapTooltip");
  if (!tooltip) return;

  // Move tooltip to <body> so it escapes any ancestor stacking context
  // (e.g. .dashboard-card's backdrop-filter) and can overlay sibling cards
  if (tooltip.parentElement !== document.body) {
    document.body.appendChild(tooltip);
  }

  const days = document.querySelectorAll(".heatmap-day:not([data-future='true'])");

  days.forEach((day) => {
    day.addEventListener("mouseenter", (e) => {
      const date = day.dataset.date;
      const count = parseInt(day.dataset.count) || 0;
      const problemLabel = count === 1 ? "problem" : "problems";
      const parsed = parseDateKey(date);
      const dateStr = parsed.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      tooltip.innerHTML = `<strong>${dateStr}</strong>${count} ${problemLabel} solved`;
      tooltip.classList.add("visible");

      // Position after content is set (getBoundingClientRect forces layout)
      positionHeatmapTooltip(e);
    });

    day.addEventListener("mousemove", positionHeatmapTooltip);

    day.addEventListener("mouseleave", () => {
      tooltip.classList.remove("visible");
    });
  });
}

function updateStreak() {
  const today = new Date();
  const lastActive = userProgress.lastActive
    ? new Date(userProgress.lastActive)
    : null;

  if (lastActive) {
    const diffDays = getDaysDifference(lastActive, today);
    if (diffDays > 1) {
      userProgress.streak = 1;
    } else if (diffDays === 0) {
      // Already active today, don't increment streak
    } else {
      let daysMissed = diffDays > 0 ? diffDays - 1 : 0;
      while (daysMissed > 0 && userProgress.freezes > 0) {
        userProgress.freezes -= 1;
        daysMissed -= 1;
        userProgress.freezeHistory.push({
          date: new Date(today.getTime() - (daysMissed + 1) * 24 * 60 * 60 * 1000).toISOString(),
          reason: "Missed day automatically frozen"
        });
      }
      if (daysMissed > 0) {
        userProgress.streak = 1;
      } else {
        userProgress.streak += 1;
        if (userProgress.streak > 0 && userProgress.streak % 7 === 0) {
          userProgress.freezes += 1;
          showNotification("Milestone reached! You earned a Streak Freeze!", "success");
        }
      }
    }
  } else {
    userProgress.streak = 1;
  }

  userProgress.lastActive = today.toISOString();
}

// ===== PROBLEM LIST CLICK HANDLERS =====
function handleProblemClick(problemId) {
  const problem = practiceProblems.find((p) => p.id === problemId);
  if (problem) {
    openQuizEditor(problem);
    addRecentProblem(problemId);
  }
}
// ===== Made addRecentProblem() Function =====
function addRecentProblem(problemId) {
  if (!userProgress.recentProblems) {
    userProgress.recentProblems = [];
  }

  // Remove existing occurrence
  userProgress.recentProblems = userProgress.recentProblems.filter(
    (id) => id !== problemId,
  );

  // Add to beginning
  userProgress.recentProblems.unshift(problemId);

  // Keep only last 5
  userProgress.recentProblems = userProgress.recentProblems.slice(0, 5);

  saveUserData();
}

// ===== SYNTAX HIGHLIGHTING =====
function updateSyntaxHighlight() {
  const editor = document.getElementById("codeEditor");
  const highlight = document.getElementById("syntaxHighlight");
  if (!editor || !highlight) return;

  const code = editor.value;
  const lines = code.split("\n");
  const lang = document.getElementById("languageSelect")?.value || "javascript";

  const highlighted = lines
    .map((line) => {
      if (lang === "javascript") {
        return highlightJS(line);
      }
      return escapeHtml(line);
    })
    .join("\n");

  highlight.innerHTML = highlighted + "\n";
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function highlightJS(line) {
    const regex = /(<[^>]+>)|(\/\/.*$)|("[^"]*"|'[^']*'|`[^`]*`)|(\b(function|const|let|var|return|if|else|for|while|do|break|continue|switch|case|default|try|catch|finally|throw|new|this|class|extends|super|import|export|from|as|async|await|yield|typeof|instanceof|void|delete|in|of|with|debugger|true|false|null|undefined)\b)|((?<!\.[a-zA-Z])\b(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?\b(?!\.[a-zA-Z]))/g;
    let result = escapeHtml(line);
    const highlighted = result.replace(regex, (m, tag, comment, str, kw, num) => {
        if (tag) return tag;
        if (comment) return '<span class="token comment">' + comment + '</span>';
        if (str) return '<span class="token string">' + str + '</span>';
        if (kw) return '<span class="token keyword">' + kw + '</span>';
        if (num) return '<span class="token number">' + num + '</span>';
        return m;
    });

    return highlighted;
}


// ===== CODE EDITOR UTILITIES =====
function updateLineNumbers() {
  const editor = document.getElementById("codeEditor");
  const lineNumbers = document.getElementById("lineNumbers");

  const lines = editor.value.split("\n").length;
  lineNumbers.innerHTML = Array.from(
    { length: Math.max(lines, 1) },
    (_, i) => i + 1,
  ).join("\n");
}

function syncScroll() {
  const editor = document.getElementById("codeEditor");
  const lineNumbers = document.getElementById("lineNumbers");
    const highlight = document.getElementById('syntaxHighlight');
    if (editor) {
        if (lineNumbers) {
          lineNumbers.scrollTop = editor.scrollTop;
        }
        if (highlight) {
            highlight.scrollTop = editor.scrollTop;
            highlight.scrollLeft = editor.scrollLeft;
        }
    }
}

// Insert code snippet
function insertSnippet(type) {
  const editor = document.getElementById("codeEditor");
  const snippets = {
    for: "for (let i = 0; i < array.length; i++) {\n    \n}",
    if: "if (condition) {\n    \n} else {\n    \n}",
    function: "function functionName(params) {\n    \n    return;\n}",
    while: "while (condition) {\n    \n}",
    switch:
      "switch (expression) {\n    case value:\n        break;\n    default:\n        break;\n}",
  };

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

// Format code (basic)
function formatCode() {
  const editor = document.getElementById("codeEditor");
  let code = editor.value;

  const lines = code.split("\n");
  const formatted = lines.map((line) => line.trimEnd()).join("\n");

  editor.value = formatted;
  editor.dispatchEvent(new Event("input"));
  updateLineNumbers();
  showNotification("Code formatted", "info");
}

// Toggle line comment
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
  if (line.trim().startsWith(char)) {
    lines[currentLine] = line.replace(new RegExp(`^\\s*${char}\\s?`), "");
  } else {
    lines[currentLine] = char + " " + line;
  }

  editor.value = lines.join("\n");
  editor.dispatchEvent(new Event("input"));
  updateLineNumbers();
}

// Toggle shortcuts panel
function toggleShortcuts() {
  const panel = document.getElementById("shortcutsPanel");
  if (panel) {
    panel.classList.toggle('active');
  }
}

// Toggle output panel (collapses and expands)
function toggleOutputPanel() {
    const panel = document.getElementById('outputPanel');
    const icon = document.getElementById('outputToggleIcon');
    if (!panel) return;
    
    panel.classList.toggle('collapsed');
    
    if (icon) {
        if (panel.classList.contains('collapsed')) {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        } else {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    }
}

function updateEditorDisplayMode() {
    const editor = document.getElementById('codeEditor');
    const highlight = document.getElementById('syntaxHighlight');

    if (!editor) return;

    editor.classList.remove('plain-text-mode');
    editor.style.setProperty('color', 'transparent', 'important');
    editor.style.setProperty('-webkit-text-fill-color', 'transparent', 'important');
    if (highlight) highlight.hidden = false;
}

// Duplicate definitions removed — single implementations kept above (lines ~3951-3979).

// Editor event listeners
// Close shortcuts when clicking outside
document.addEventListener("click", (e) => {
  const panel = document.getElementById("shortcutsPanel");
  if (
    panel &&
    !e.target.closest(".shortcuts-panel") &&
    !e.target.closest('[onclick="toggleShortcuts()"]')
  ) {
    panel.classList.remove("active");
  }
});

// Footer question handlers for quiz editor
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("footer-question")) {
    const question = e.target.getAttribute("data-question");
    // Add the question to the chatbot input and send it
    const chatbotInput = document.getElementById("chatbotInput");
    const chatbotSend = document.getElementById("chatbotSend");
    if (chatbotInput && chatbotSend) {
      chatbotInput.value = question;
      // Trigger the send message function
      chatbotSend.click();

      // Open chatbot if it's closed
      const chatbotWindow = document.getElementById("chatbotWindow");
      const chatbotToggle = document.getElementById("chatbotToggle");
      if (chatbotWindow && chatbotToggle) {
        chatbotWindow.classList.remove("hidden");
        chatbotToggle.querySelector(".chatbot-badge").style.display = "none";
      }
    }
  }
});

function initializeQuizEditor() {
    const editor = document.getElementById('codeEditor');
    const languageSelect = document.getElementById('languageSelect');

    if (!editor || editor.dataset.initialized === 'true') {
        return;
    }

    editor.dataset.initialized = 'true';

    const syncEditorState = () => {
        updateSyntaxHighlight();
        updateLineNumbers();
        syncScroll();
    };

    editor.addEventListener('input', () => {
        syncEditorState();
        // Persist draft while the user types so it survives page reloads.
        if (currentProblem) {
            saveEditorDraft(currentProblem.id, editor.value);
        }
    });
    editor.addEventListener('scroll', syncScroll);
    editor.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            const value = editor.value;
            editor.value = `${value.slice(0, start)}    ${value.slice(end)}`;
            editor.selectionStart = editor.selectionEnd = start + 4;
            syncEditorState();
        } else if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            runQuizCode();
        } else if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            submitQuizCode();
        }
    });

    if (languageSelect) {
        languageSelect.addEventListener('change', () => {
            const editor = document.getElementById('codeEditor');
            if (editor && currentProblem) {
                editor.value = getDefaultCode(languageSelect.value, currentProblem);
                editor.scrollTop = 0;
                editor.scrollLeft = 0;
            }
            syncEditorState();
            updateEditorDisplayMode();
        });
    }

    syncEditorState();
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initializeQuizEditor);
} else {
    initializeQuizEditor();
}

// ===== FOOTER QUESTION HANDLERS =====
// Initialize some animations after page load
window.addEventListener("load", () => {
});
// ✅ FIX: Current Date feature for dashboard + profile

function updateDate() {
    const today = new Date();

    const formattedDate = today.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    const dashboardDate = document.getElementById("dashboard-current-date");
    const profileDate = document.getElementById("profile-current-date");

    if (dashboardDate) {
        dashboardDate.textContent = formattedDate;
    }

    if (profileDate) {
        profileDate.textContent = formattedDate;
    }
}

// run immediately
updateDate();

// optional: auto refresh every hour (safe for daily date change)
setInterval(updateDate, 60 * 60 * 1000);
let isRunning = false;

document.addEventListener("DOMContentLoaded", () => {
  const codeEl = document.getElementById("perlEditor");
  const outputEl = document.getElementById("perlOutput");

  document.getElementById("runBtn").addEventListener("click", runPerl);

  document.getElementById("resetBtn").addEventListener("click", () => {
    codeEl.value = "";
    outputEl.textContent = "Run code to see output...";
  });

  document.getElementById("sampleBtn").addEventListener("click", () => {
    codeEl.value =
`print "Hello World\\n";

my $name = "DSA Learner";
print "Welcome $name\\n";`;
  });
});

async function runPerl() {
  if (isRunning) return;
  isRunning = true;

  const editor = document.getElementById("perlEditor");
  const output = document.getElementById("perlOutput");

  const code = editor ? editor.value.trim() : "";

  console.log("DEBUG CODE:", code); // 👈 important debug

  if (!code) {
    output.textContent = "❌ No code provided";
    isRunning = false;
    return;
  }

  output.textContent = "Running... ⏳";

  try {
    const res = await fetch("http://localhost:5000/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    });

    const data = await res.json().catch(() => ({}));

    output.textContent = data.output || data.error || "No output";
  } catch (err) {
    output.textContent = "Error: " + err.message;
  }


  isRunning = false;
}

// ===== NEWSLETTER FORM VALIDATION =====
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

function initNewsletterValidation() {
  const forms = [
    {
      formId: "newsletterForm",
      inputId: "newsletterEmail",
      errorId: "newsletterError",
    },
  ];

  forms.forEach(({ formId, inputId, errorId }) => {
    const form = document.getElementById(formId);
    if (!form) return;

    const input = document.getElementById(inputId);
    const errorSpan = document.getElementById(errorId);

    function showError(message) {
      errorSpan.textContent = message;
      input.classList.add("input-error");
      input.classList.remove("input-success");
      input.setAttribute("aria-invalid", "true");
    }

    function showSuccess() {
      errorSpan.textContent = "";
      input.classList.remove("input-error");
      input.classList.add("input-success");
      input.removeAttribute("aria-invalid");
    }

    function clearState() {
      errorSpan.textContent = "";
      input.classList.remove("input-error", "input-success");
      input.removeAttribute("aria-invalid");
    }

    // Validate on blur (when user leaves the field)
    input.addEventListener("blur", () => {
      const value = input.value.trim();
      if (!value) {
        showError("Email address is required.");
      } else if (!validateEmail(value)) {
        showError(
          "Please enter a valid email address (e.g. user@example.com).",
        );
      } else {
        showSuccess();
      }
    });

    // Clear error while user is typing
    input.addEventListener("input", () => {
      clearState();
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const value = input.value.trim();

      if (!value) {
        showError("Email address is required.");
        input.focus();
        return;
      }

      if (!validateEmail(value)) {
        showError(
          "Please enter a valid email address (e.g. user@example.com).",
        );
        input.focus();
        return;
      }

      // Valid — show success notification and reset
      showSuccess();
      showNotification(
        "🎉 Successfully subscribed to the newsletter!",
        "success",
      );
      input.value = "";
      setTimeout(() => clearState(), 1500);
    });
  });
}
// Back To Top Button (supports both ids: backToTopBtn and scrollTopBtn)
function initFooterCurrentDate() {
  const yearEl = document.getElementById("footer-current-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const dateEl = document.getElementById("footer-current-date");
  if (dateEl) {
    dateEl.textContent = `Today: ${new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })}`;
  }
}

function initBackToTopButtons() {

  const backToTopBtn = document.getElementById("backToTopBtn");
  const scrollTopBtn = document.getElementById("scrollTopBtn");

  // backToTopBtn uses .back-to-top styles + .show class
  if (backToTopBtn) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 300) {
        backToTopBtn.classList.add("show");
      } else {
        backToTopBtn.classList.remove("show");
      }
    });

    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  // scrollTopBtn uses .scroll-top-btn styles + .visible class
  if (scrollTopBtn) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 300) {
        scrollTopBtn.classList.add("visible");
      } else {
        scrollTopBtn.classList.remove("visible");
      }
    });

    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }
}

initBackToTopButtons();


// Centralized SPA State Router for Native Browser Navigation
window.addEventListener('hashchange', () => {
    const currentHash = window.location.hash || '#home';
    console.log(`[Router] Navigation hash shifted to: ${currentHash}`);

    if (currentHash === '#home' || currentHash === '') {
        // 1. Scan the entire page dynamically for any layout changes
        document.querySelectorAll('*').forEach(element => {
            // A. If an element is a quiz or assistant component, hide it completely
            if (element.id?.toLowerCase().includes('quiz') || 
                element.className?.toString().toLowerCase().includes('quiz') ||
                element.id?.toLowerCase().includes('assistant')) {
                element.style.display = 'none';
            } 
            // B. If it's a main structural container that was hidden, bring it back
            else if (element.classList.contains('hidden') && element.id !== 'loading-screen') {
                element.classList.remove('hidden');
                element.style.display = ''; // Resets style to default stylesheet value
            }
        });

        // 2. Clear any active runtime quiz instances safely
        if (typeof tQuiz !== 'undefined') {
            tQuiz = null;
        }
    }
});
// ===== GAME SYSTEM =====
let currentGame = {
  type: null,
  topic: null,
  questions: [],
  currentIndex: 0,
  score: 0,
  correct: 0,
  total: 0,
  timer: null,
  timeLeft: 30,
  xpEarned: 0,
  level: 1,
  memoryCards: [],
  flippedMemoryCards: [],
  matchedMemoryPairs: 0,
  memoryMoves: 0,
};

// Complexity guesser questions
const complexityQuestions = [
  {
    question: "What is the time complexity of this code?\n\nfor(let i=0; i<n; i++) {\n  console.log(i);\n}",
    options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    correct: 2,
    explanation: "Single loop runs n times = O(n)"
  },
  {
    question: "What is the time complexity?\n\nfor(let i=0; i<n; i++) {\n  for(let j=0; j<n; j++) {\n    console.log(i,j);\n  }\n}",
    options: ["O(n)", "O(n log n)", "O(n²)", "O(2^n)"],
    correct: 2,
    explanation: "Nested loops both running n times = O(n²)"
  },
  {
    question: "What is the time complexity?\n\nlet i = n;\nwhile(i > 1) {\n  i = Math.floor(i/2);\n}",
    options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    correct: 1,
    explanation: "Halving n each time = O(log n)"
  },
  {
    question: "What is the space complexity?\n\nfunction sum(n) {\n  if(n <= 0) return 0;\n  return n + sum(n-1);\n}",
    options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    correct: 2,
    explanation: "Recursive calls stack n frames = O(n) space"
  },
  {
    question: "What is the time complexity of binary search?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correct: 1,
    explanation: "Binary search halves search space each step = O(log n)"
  },
  {
    question: "What is the time complexity?\n\nconst map = {};\nfor(let i=0; i<n; i++) {\n  map[arr[i]] = i;\n}",
    options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    correct: 2,
    explanation: "Single loop with O(1) hash operations = O(n)"
  },
  {
    question: "What is the time complexity of merge sort?",
    options: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"],
    correct: 1,
    explanation: "Merge sort divides and merges = O(n log n)"
  },
  {
    question: "What is the space complexity of an array of size n?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    correct: 2,
    explanation: "Array stores n elements = O(n) space"
  },
  {
    question: "What is the time complexity of accessing a hash map?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    correct: 0,
    explanation: "Hash map provides O(1) average access time"
  },
];

const gameLevels = [
  { name: "Beginner", topic: "Arrays", difficulty: "Easy", icon: "🌱" },
  { name: "Novice", topic: "Strings", difficulty: "Easy", icon: "🔤" },
  { name: "Intermediate", topic: "Linked Lists", difficulty: "Medium", icon: "🔗" },
  { name: "Advanced", topic: "Trees", difficulty: "Medium", icon: "🌳" },
  { name: "Expert", topic: "Graphs", difficulty: "Hard", icon: "🕸️" },
  { name: "Master", topic: "Dynamic Programming", difficulty: "Hard", icon: "🎯" },
  { name: "Grandmaster", topic: "Mixed DSA", difficulty: "Expert", icon: "⚔️" },
  { name: "Legend", topic: "Interview Mix", difficulty: "Expert", icon: "🏆" },
];

const memoryCardPairs = [
  { term: "Array", definition: "Contiguous indexed collection" },
  { term: "Stack", definition: "Last In, First Out structure" },
  { term: "Queue", definition: "First In, First Out structure" },
  { term: "Hash Map", definition: "Key-value lookup table" },
  { term: "Recursion", definition: "Function calls itself" },
  { term: "Binary Search", definition: "Halves sorted search space" },
  { term: "BFS", definition: "Level-order graph traversal" },
  { term: "DP", definition: "Overlapping subproblems cache" },
];

const codeCompletionQuestions = [
  {
    snippet: "function twoSum(nums, target) {\n  const seen = new Map();\n\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n\n    if (seen.has(complement)) {\n      return [seen.get(complement), i];\n    }\n\n    ____;\n  }\n}",
    options: ["seen.set(nums[i], i)", "seen.push(nums[i], i)", "seen.add(i, nums[i])", "seen[nums[i]] = true"],
    correct: 0,
    explanation: "Store each value with its index so a future complement can find it in O(1)."
  },
  {
    snippet: "function isValidParentheses(s) {\n  const stack = [];\n  const pairs = { ')': '(', ']': '[', '}': '{' };\n\n  for (const ch of s) {\n    if (ch === '(' || ch === '[' || ch === '{') {\n      stack.push(ch);\n    } else if (____ !== stack.pop()) {\n      return false;\n    }\n  }\n\n  return stack.length === 0;\n}",
    options: ["pairs[ch]", "stack[ch]", "ch", "pairs[stack.pop()]"],
    correct: 0,
    explanation: "pairs[ch] gives the expected opening bracket for the current closing bracket."
  },
  {
    snippet: "function binarySearch(nums, target) {\n  let left = 0;\n  let right = nums.length - 1;\n\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n\n    if (nums[mid] === target) return mid;\n    if (nums[mid] < target) left = mid + 1;\n    else ____;\n  }\n\n  return -1;\n}",
    options: ["right = mid - 1", "left = mid - 1", "right = left + 1", "mid = right - 1"],
    correct: 0,
    explanation: "When nums[mid] is greater than target, discard the right half by moving right left."
  },
  {
    snippet: "function maxSubArray(nums) {\n  let best = nums[0];\n  let current = nums[0];\n\n  for (let i = 1; i < nums.length; i++) {\n    current = Math.max(nums[i], ____);\n    best = Math.max(best, current);\n  }\n\n  return best;\n}",
    options: ["current + nums[i]", "best + nums[i]", "nums[i - 1] + nums[i]", "current - nums[i]"],
    correct: 0,
    explanation: "Kadane's algorithm either extends the previous subarray or starts fresh at nums[i]."
  },
  {
    snippet: "function reverseLinkedList(head) {\n  let prev = null;\n  let current = head;\n\n  while (current) {\n    const next = current.next;\n    ____;\n    prev = current;\n    current = next;\n  }\n\n  return prev;\n}",
    options: ["current.next = prev", "prev.next = current", "current = prev", "head.next = prev"],
    correct: 0,
    explanation: "Reverse each node's next pointer to point to the previous node."
  },
];

function openGameModal() {
  const modal = document.getElementById("gameModal");
  const level = userProgress.level || 1;
  const levelData = gameLevels[level - 1] || gameLevels[0];

  document.getElementById("gameModalTitle").textContent =
    `🎮 Level ${level} - ${levelData.name} Games`;
  currentGame.level = level;
  showLevelSelector();
  modal.classList.add("active");
}

function closeGameModal() {
  document.getElementById("gameModal").classList.remove("active");
  clearInterval(currentGame.timer);
  resetGame();
}

function showLevelSelector() {
  clearInterval(currentGame.timer);
  document.getElementById("levelSelector").style.display = "block";
  document.getElementById("gameTypeSelector").style.display = "none";
  document.getElementById("memoryGameArea").style.display = "none";
  document.getElementById("codeGameArea").style.display = "none";
  document.getElementById("gamePlayArea").style.display = "none";
  document.getElementById("gameResults").style.display = "none";
  renderLevelSelectionGrid();
}

function showGameTypeSelector() {
  clearInterval(currentGame.timer);
  document.getElementById("levelSelector").style.display = "none";
  document.getElementById("memoryGameArea").style.display = "none";
  document.getElementById("codeGameArea").style.display = "none";
  document.getElementById("gamePlayArea").style.display = "none";
  document.getElementById("gameResults").style.display = "none";
  document.getElementById("gameTypeSelector").style.display = "block";
  updateGameLevelInfo();
}

function renderLevelSelectionGrid() {
  const grid = document.getElementById("levelSelectionGrid");
  const unlockedLevels = userProgress.level || 1;

  grid.innerHTML = gameLevels
    .map((level, index) => {
      const levelNumber = index + 1;
      const isUnlocked = levelNumber <= unlockedLevels;
      const isCurrent = levelNumber === (userProgress.level || 1);

      return `
        <div class="level-selection-card ${isUnlocked ? "unlocked" : "locked"}" onclick="${isUnlocked ? `selectGameLevel(${levelNumber})` : "showNotification('Complete earlier levels to unlock this game mode.', 'error')"}">
          <span class="level-card-status ${isCurrent ? "current-status" : isUnlocked ? "unlocked-status" : "locked-status"}">${isCurrent ? "Current" : isUnlocked ? "Unlocked" : "Locked"}</span>
          <div class="level-card-icon">${level.icon}</div>
          <div class="level-card-name">Level ${levelNumber}: ${level.name}</div>
          <div class="level-card-topic">${level.topic}</div>
          <div class="level-card-xp">${level.difficulty} • ${level.topic}</div>
        </div>
      `;
    })
    .join("");
}

function selectGameLevel(level) {
  currentGame.level = level;
  const levelData = gameLevels[level - 1] || gameLevels[0];
  document.getElementById("gameModalTitle").textContent =
    `🎮 Level ${level} - ${levelData.name} Games`;
  showGameTypeSelector();
}

function getTopicForLevel(level = currentGame.level || userProgress.level || 1) {
  const topics = ["arrays", "strings", "linkedlist", "trees", "graphs", "dp", "arrays", "strings"];
  return topics[level - 1] || "arrays";
}

function getDifficultyForLevel(level = currentGame.level || userProgress.level || 1) {
  return gameLevels[level - 1]?.difficulty || "Easy";
}

function updateGameLevelInfo() {
  const level = currentGame.level || userProgress.level || 1;
  const levelData = gameLevels[level - 1] || gameLevels[0];

  document.getElementById("gameLevelTopic").textContent = `📚 Topic: ${levelData.topic}`;
  document.getElementById("gameLevelDifficulty").textContent = `⚡ Difficulty: ${levelData.difficulty}`;
}

function startGame(type, level = currentGame.level) {
  if (level) currentGame.level = level;
  currentGame.type = type;

  if (type === "memory") {
    startMemoryGame();
    return;
  }

  if (type === "code") {
    startCodeGame();
    return;
  }

  currentGame.score = 0;
  currentGame.correct = 0;
  currentGame.xpEarned = 0;
  currentGame.currentIndex = 0;

  const topic = getTopicForLevel();

  if (type === "complexity") {
    currentGame.questions = [...complexityQuestions].sort(() => Math.random() - 0.5).slice(0, 10);
  } else {
    const topicQuestions = quizQuestions[topic] || quizQuestions.arrays;
    currentGame.questions = [...topicQuestions].sort(() => Math.random() - 0.5).slice(0, 10);
  }

  currentGame.total = currentGame.questions.length;

  document.getElementById("gameTypeSelector").style.display = "none";
  document.getElementById("levelSelector").style.display = "none";
  document.getElementById("memoryGameArea").style.display = "none";
  document.getElementById("codeGameArea").style.display = "none";
  document.getElementById("gamePlayArea").style.display = "block";
  document.getElementById("gameResults").style.display = "none";

  loadGameQuestion();
}

function loadGameQuestion() {
  if (currentGame.currentIndex >= currentGame.total) {
    endGame();
    return;
  }

  const q = currentGame.questions[currentGame.currentIndex];
  document.getElementById("gameQuestion").textContent = currentGame.currentIndex + 1;
  document.getElementById("gameScore").textContent = currentGame.score;
  document.getElementById("gameQuestionText").textContent = q.question;
  document.getElementById("gameExplanation").style.display = "none";

  const optionsGrid = document.getElementById("gameOptionsGrid");
  optionsGrid.innerHTML = q.options.map((opt, i) =>
    `<button class="game-option" onclick="selectGameAnswer(${i})">${opt}</button>`
  ).join("");

  clearInterval(currentGame.timer);
  currentGame.timeLeft = currentGame.type === "speed" ? 60 : 30;

  document.getElementById("gameTimer").textContent = currentGame.timeLeft;

  currentGame.timer = setInterval(() => {
    currentGame.timeLeft--;
    document.getElementById("gameTimer").textContent = currentGame.timeLeft;
    if (currentGame.timeLeft <= 0) {
      clearInterval(currentGame.timer);
      if (currentGame.type === "speed") {
        endGame();
      } else {
        selectGameAnswer(-1);
      }
    }
  }, 1000);
}

function selectGameAnswer(index) {
  clearInterval(currentGame.timer);
  const q = currentGame.questions[currentGame.currentIndex];
  const options = document.querySelectorAll(".game-option");
  const xpPerQ = currentGame.type === "quiz" ? 20 : currentGame.type === "speed" ? 10 : 15;

  options.forEach((opt) => (opt.style.pointerEvents = "none"));

  if (index === q.correct) {
    if (options[index]) options[index].classList.add("correct");
    currentGame.score += 10;
    currentGame.correct++;
    currentGame.xpEarned += xpPerQ;
    document.getElementById("gameScore").textContent = currentGame.score;
  } else {
    if (options[index]) options[index].classList.add("wrong");
    if (options[q.correct]) options[q.correct].classList.add("correct");
  }

  const expEl = document.getElementById("gameExplanation");
  expEl.textContent = `💡 ${q.explanation}`;
  expEl.style.display = "block";

  currentGame.currentIndex++;

  setTimeout(() => {
    loadGameQuestion();
  }, currentGame.type === "speed" ? 800 : 1500);
}

function startMemoryGame() {
  currentGame.score = 0;
  currentGame.correct = 0;
  currentGame.xpEarned = 0;
  currentGame.currentIndex = 0;
  currentGame.total = memoryCardPairs.length;
  currentGame.memoryCards = [];
  currentGame.flippedMemoryCards = [];
  currentGame.matchedMemoryPairs = 0;
  currentGame.memoryMoves = 0;
  currentGame.timeLeft = 60;

  document.getElementById("gameTypeSelector").style.display = "none";
  document.getElementById("levelSelector").style.display = "none";
  document.getElementById("gamePlayArea").style.display = "none";
  document.getElementById("codeGameArea").style.display = "none";
  document.getElementById("memoryGameArea").style.display = "block";
  document.getElementById("gameResults").style.display = "none";
  document.getElementById("memoryTimer").textContent = currentGame.timeLeft;
  document.getElementById("memoryMatches").textContent = "0";
  document.getElementById("memoryMoves").textContent = "0";

  memoryCardPairs.forEach((pair, index) => {
    currentGame.memoryCards.push({ id: index, value: pair.term, type: "term" });
    currentGame.memoryCards.push({ id: index, value: pair.definition, type: "definition" });
  });

  currentGame.memoryCards = shuffleArray(currentGame.memoryCards);
  renderMemoryCards();

  clearInterval(currentGame.timer);
  currentGame.timer = setInterval(() => {
    currentGame.timeLeft--;
    document.getElementById("memoryTimer").textContent = currentGame.timeLeft;
    if (currentGame.timeLeft <= 0) {
      endGame();
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
        void 0;
      });
      
    navigator.serviceWorker.addEventListener('message', async (event) => {
      if (event.data && event.data.type === 'PROCESS_OFFLINE_QUEUE') {
        if (window.offlineStore && typeof window.offlineStore.syncQueue === 'function') {
          void 0;
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
// ACTIVITY FEED
// ============================================

const ACTIVITY_STORAGE_KEY = 'userActivities';
const MAX_ACTIVITIES = 50;

/**
 * Get all activities from localStorage
 * @returns {Array} List of activities
 */
function getActivities() {
    try {
        const data = localStorage.getItem(ACTIVITY_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        void 0;
        return [];
    }
}

/**
 * Get recent activities
 * @param {number} limit - Number of activities to return
 * @returns {Array} Recent activities
 */
function getRecentActivities(limit = 10) {
    const activities = getActivities();
    return activities.slice(0, limit);
}

/**
 * Add a new activity
 * @param {string} type - Activity type (solved, quiz, badge, streak, level, xp, practice)
 * @param {Object} data - Activity data
 * @param {string} data.message - Main message
 * @param {string} data.detail - Additional detail (optional)
 */
function addActivity(type, data) {
    const activities = getActivities();
    
    const activity = {
        id: Date.now(),
        type: type,
        message: data.message || '',
        detail: data.detail || '',
        timestamp: new Date().toISOString(),
        data: data
    };
    
    activities.unshift(activity);
    
    // Keep only last MAX_ACTIVITIES
    if (activities.length > MAX_ACTIVITIES) {
        activities.length = MAX_ACTIVITIES;
    }
    
    localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(activities));
    
    // Re-render activity feed
    renderActivityFeed();
}

/**
 * Clear all activities
 */
function clearActivities() {
    if (confirm('Are you sure you want to clear all activity history?')) {
        localStorage.removeItem(ACTIVITY_STORAGE_KEY);
        renderActivityFeed();
        showNotification('Activity history cleared', 'info');
    }
}

/**
 * Get icon for activity type
 * @param {string} type - Activity type
 * @returns {string} Icon HTML
 */
function getActivityIcon(type) {
    const icons = {
        solved: '✅',
        quiz: '📝',
        badge: '🏆',
        streak: '🔥',
        level: '⬆️',
        xp: '⭐',
        practice: '💻'
    };
    return icons[type] || '📌';
}

/**
 * Get CSS class for activity type
 * @param {string} type - Activity type
 * @returns {string} CSS class
 */
function getActivityClass(type) {
    const classes = {
        solved: 'solved',
        quiz: 'quiz',
        badge: 'badge',
        streak: 'streak',
        level: 'level',
        xp: 'xp',
        practice: 'practice'
    };
    return classes[type] || 'practice';
}

/**
 * Format time for display
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted time
 */
function formatActivityTime(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
    });
}

/**
 * Render activity feed
 */
function renderActivityFeed() {
    const container = document.getElementById('activityFeed');
    if (!container) return;
    
    const activities = getRecentActivities(10);
    const countEl = document.getElementById('activityCount');
    
    if (countEl) {
        const total = getActivities().length;
        countEl.textContent = `${total} activity${total !== 1 ? 'ies' : ''}`;
    }
    
    if (activities.length === 0) {
        container.innerHTML = `
            <div class="activity-empty">
                <i class="fas fa-inbox"></i>
                <p>No recent activity yet. Start solving problems!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = activities.map((activity, index) => {
        const icon = getActivityIcon(activity.type);
        const typeClass = getActivityClass(activity.type);
        const time = formatActivityTime(activity.timestamp);
        const isNew = index === 0;
        
        return `
            <div class="activity-item ${isNew ? 'new' : ''}">
                <div class="activity-icon ${typeClass}">${icon}</div>
                <div class="activity-content">
                    <p class="activity-message">${activity.message}</p>
                    ${activity.detail ? `<p class="activity-detail">${activity.detail}</p>` : ''}
                </div>
                <span class="activity-time">${time}</span>
            </div>
        `;
    }).join('');
}

/**
 * Track problem solved activity
 * @param {string} problemName - Name of the problem
 * @param {string} difficulty - Difficulty level
 */
function trackProblemSolved(problemName, difficulty = '') {
    addActivity('solved', {
        message: `Solved <strong>${problemName}</strong>`,
        detail: difficulty ? `Difficulty: ${difficulty}` : '',
        problem: problemName,
        difficulty: difficulty
    });
}

/**
 * Track quiz completed activity
 * @param {string} topic - Topic name
 * @param {number} score - Score percentage
 */
function trackQuizCompleted(topic, score) {
    addActivity('quiz', {
        message: `Completed <strong>${topic}</strong> quiz`,
        detail: `Score: ${score}%`,
        topic: topic,
        score: score
    });
}

/**
 * Track badge earned activity
 * @param {string} badgeName - Name of the badge
 */
function trackBadgeEarned(badgeName) {
    addActivity('badge', {
        message: `Earned <strong>${badgeName}</strong> badge 🏆`,
        detail: '',
        badge: badgeName
    });
}

/**
 * Track streak milestone activity
 * @param {number} streak - Current streak count
 */
function trackStreakMilestone(streak) {
    addActivity('streak', {
        message: `Achieved <strong>${streak}-day</strong> streak 🔥`,
        detail: 'Keep going!',
        streak: streak
    });
}

/**
 * Track level up activity
 * @param {number} level - New level
 * @param {string} levelName - Level name
 */
function trackLevelUp(level, levelName) {
    addActivity('level', {
        message: `Reached <strong>Level ${level}</strong> - ${levelName} ⬆️`,
        detail: 'Keep climbing!',
        level: level
    });
}

/**
 * Track XP earned activity
 * @param {number} xp - XP earned
 * @param {string} source - Source of XP
 */
function trackXPEarned(xp, source = '') {
    addActivity('xp', {
        message: `Earned <strong>+${xp} XP</strong>`,
        detail: source ? `From: ${source}` : '',
        xp: xp,
        source: source
    });
}

/**
 * Track practice activity
 * @param {string} action - Action performed
 */
function trackPractice(action) {
    addActivity('practice', {
        message: `Practiced: <strong>${action}</strong>`,
        detail: '',
        action: action
    });
}

// --- Initialize Activity Feed ---

/**
 * Initialize activity feed
 */
function initActivityFeed() {
    renderActivityFeed();
    
    // Clear activity button
    const clearBtn = document.getElementById('clearActivityBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearActivities);
    }
    
    // View all button
    const viewAllBtn = document.getElementById('viewAllActivityBtn');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => {
            // Scroll to activity section or open modal
            const activityCard = document.querySelector('.activity-feed-card');
            if (activityCard) {
                activityCard.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
}

// --- Override existing tracking functions ---

// If you have existing functions, override them
const originalAddXP = window.addXP || function() {};
window.addXP = function(amount, source = '', meta = {}) {
    originalAddXP(amount, source, meta);
    trackXPEarned(amount, source);
};

// Track when problem is solved
const originalProblemSolved = window.handleProblemSolved || function() {};
window.handleProblemSolved = function(problemName, difficulty) {
    originalProblemSolved(problemName, difficulty);
    trackProblemSolved(problemName, difficulty);
};

// --- Initialize on page load ---

document.addEventListener('DOMContentLoaded', function() {
    initActivityFeed();
});

// This file is loaded via a classic <script> tag (not a module), so it
// cannot use `export`. Its top-level function declarations above
// (getActivities, getRecentActivities, addActivity, clearActivities,
// renderActivityFeed, trackProblemSolved, trackQuizCompleted,
// trackBadgeEarned, trackStreakMilestone, trackLevelUp, trackXPEarned,
// trackPractice, initActivityFeed) are already globally accessible.

// In your quiz completion function
function completeQuiz(topic, score) {
    // ... existing code ...
    trackQuizCompleted(topic, score);
    // ... existing code ...
}

// In your badge earning function
function earnBadge(badgeName) {
    // ... existing code ...
    trackBadgeEarned(badgeName);
    // ... existing code ...
}

// In your level up function
function checkLevelUp() {
    // ... existing code ...
    if (newLevel > userProgress.level) {
        trackLevelUp(newLevel, levelNames[newLevel - 1]);
    }
    // ... existing code ...
}

// In your streak update function
function updateStreak() {
    // ... existing code ...
    if (userProgress.streak > 0 && userProgress.streak % 7 === 0) {
        trackStreakMilestone(userProgress.streak);
    }
    // ... existing code ...
}

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
