// Nuke all caches on every page load — ensures fresh content always
(async function nukeCaches() {
  try {
    // Delete IndexedDB cache
    indexedDB.deleteDatabase('AlgoInfinityCache');
  } catch (e) {}
  try {
    // Unregister all service workers
    const regs = await navigator.serviceWorker?.getRegistrations();
    if (regs) for (const r of regs) await r.unregister();
  } catch (e) {}
})();



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

async function loadPartial(id, url) {
  const abortKey = `partial_${id}`;
  try {
    const signal = window.apiAbort ? window.apiAbort.getSignal(abortKey) : undefined;
    const base = getPartialsBase();
    const filename = url.replace(/^\/?partials\//, '');
    const fetchUrl = base + '/' + filename + '?t=' + Date.now();
    
    const resp = await fetch(fetchUrl, { signal });
    if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
    const html = await resp.text();
    
    document.getElementById(id).innerHTML = html;
    if (typeof handleActiveNav === 'function') handleActiveNav();
  } catch (e) {
    if (e.name !== 'AbortError') {
      void 0;
    }
  } finally {
    if (window.apiAbort) window.apiAbort.clearSignal(abortKey);
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
userProgress = window.userProgress;

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
  const signal = window.apiAbort.getSignal('leaderboard');
  try {
    return await window.apiCache.fetchWithCache("/api/leaderboard", { credentials: "include", signal }, 300000, 'json');
  } finally {
    window.apiAbort.clearSignal('leaderboard');
  }
}
cachedSession = null;
progressSyncTimer = null;
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
if (typeof initializeQuizEditor === 'function') {
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', initializeQuizEditor);
  else initializeQuizEditor();
}

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
    
    // Only render problems if the page has a problems container
    if (document.querySelector('.problems-list')) {
        filterProblems();
    }
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
    if (!document.querySelector('.problems-list')) return;
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
    
    // Render the problems (only if function exists on this page)
    if (typeof renderProblems === 'function') {
        renderProblems(pageProblems);
    }
    
    // Update pagination
    if (typeof updatePaginationControls === 'function') {
        updatePaginationControls(currentPage, totalPages);
    }
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
