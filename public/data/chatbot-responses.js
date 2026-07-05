// Chatbot Responses Data
window.chatbotResponses = {
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
  default: "I can help with DSA topics, coding problems, system design, interview tips, and career advice. Try asking about specific algorithms, data structures, time complexity, or problem-solving strategies!"
};