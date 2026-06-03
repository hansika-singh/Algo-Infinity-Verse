// ===== QUIZ DATA =====
const quizQuestions = {
  arrays: [
    {
      id: "arrays-1",
      question:
        "What is the time complexity of accessing an element in an array by index?",
      options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
      correct: 0,
      explanation:
        "Arrays provide O(1) random access because elements are stored contiguously in memory.",
    },
    {
      id: "arrays-2",
      question: "Which of the following is NOT a characteristic of arrays?",
      options: [
        "Fixed size (in static arrays)",
        "O(1) access time",
        "Elements must be of different types",
        "Contiguous memory allocation",
      ],
      correct: 2,
      explanation:
        "In arrays, all elements must be of the same type. This is a key characteristic of arrays.",
    },
    {
      id: "arrays-3",
      question:
        "What is the time complexity of inserting an element at the beginning of an array?",
      options: ["O(1)", "O(n)", "O(log n)", "O(1)"],
      correct: 1,
      explanation:
        "Inserting at the beginning requires shifting all existing elements, which is O(n).",
    },
    {
      id: "arrays-4",
      question:
        "Which technique is commonly used to find the maximum subarray sum?",
      options: [
        "Binary Search",
        "Kadane's Algorithm",
        "Two Pointers",
        "Dynamic Programming only",
      ],
      correct: 1,
      explanation:
        "Kadane's Algorithm efficiently finds maximum subarray sum in O(n) time using dynamic programming.",
    },
    {
      id: "arrays-5",
      question: "What does the 'Two Sum' problem typically ask for?",
      options: [
        "Find two numbers that multiply to target",
        "Find two numbers that sum to target",
        "Find all pairs in array",
        "Find the two largest numbers",
      ],
      correct: 1,
      explanation:
        "Two Sum asks: given an array and target, return indices of two numbers that add up to the target.",
    },
    {
      id: "arrays-6",
      question:
        "Which data structure is often used to solve Two Sum in O(n) time?",
      options: ["Stack", "Queue", "Hash Map", "Linked List"],
      correct: 2,
      explanation:
        "A hash map stores values and their indices for O(1) lookups, enabling O(n) solution.",
    },
    {
      id: "arrays-7",
      question: "What is the space complexity of a static array of size n?",
      options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
      correct: 1,
      explanation: "Static array uses O(n) space to store n elements.",
    },
    {
      id: "arrays-8",
      question:
        "Which problem involves rotating an array elements to the right by k steps?",
      options: [
        "Reverse Words",
        "Rotate Array",
        "Shift Elements",
        "Circular Buffer",
      ],
      correct: 1,
      explanation:
        "The 'Rotate Array' problem asks to shift elements right by k positions in circular fashion.",
    },
    {
      id: "arrays-9",
      question:
        "What is the time complexity of merging two sorted arrays of sizes m and n?",
      options: ["O(1)", "O(max(m,n))", "O(m+n)", "O(m*n)"],
      correct: 2,
      explanation:
        "Merging two sorted arrays takes O(m+n) time as each element is processed once.",
    },
    {
      id: "arrays-10",
      question:
        "Which technique uses three pointers to solve 'Sort Colors' (Dutch National Flag) problem?",
      options: [
        "Sliding Window",
        "Two Pointers",
        "Three Pointers",
        "Flood Fill",
      ],
      correct: 2,
      explanation:
        "Dutch National Flag algorithm uses three pointers (low, mid, high) to sort 0s, 1s, and 2s in one pass.",
    },
  ],
  strings: [
    {
      id: "strings-1",
      question:
        "What is the time complexity of checking if two strings are equal?",
      options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
      correct: 1,
      explanation:
        "String comparison requires checking each character, making it O(n) where n is string length.",
    },
    {
      id: "strings-2",
      question: "Which algorithm is used for pattern matching in strings?",
      options: [
        "Dijkstra",
        "KMP (Knuth-Morris-Pratt)",
        "Floyd-Warshall",
        "Kruskal",
      ],
      correct: 1,
      explanation:
        "KMP algorithm efficiently finds occurrences of a pattern in text in O(n+m) time.",
    },
    {
      id: "strings-3",
      question:
        "What data structure is ideal for checking balanced parentheses?",
      options: ["Queue", "Stack", "Heap", "Hash Set"],
      correct: 1,
      explanation:
        "Stack's LIFO property perfectly matches parentheses matching: push opening, pop when closing matches.",
    },
    {
      id: "strings-4",
      question:
        "What is the space complexity of generating all substrings of a string of length n?",
      options: ["O(1)", "O(n)", "O(n^2)", "O(2^n)"],
      correct: 2,
      explanation:
        "A string of length n has n(n+1)/2 substrings, which is O(n^2) space.",
    },
    {
      id: "strings-5",
      question:
        "Which technique is used to find the longest substring without repeating characters?",
      options: [
        "Dynamic Programming",
        "Sliding Window",
        "Binary Search",
        "Recursion",
      ],
      correct: 1,
      explanation:
        "Sliding window with a hash set tracks unique characters and expands/contracts as needed.",
    },
    {
      id: "strings-6",
      question: "What does 'palindrome' mean for a string?",
      options: [
        "All characters unique",
        "Reads same forwards and backwards",
        "Contains only vowels",
        "All characters uppercase",
      ],
      correct: 1,
      explanation:
        "A palindrome reads the same forwards and backwards (e.g., 'madam', 'racecar').",
    },
    {
      id: "strings-7",
      question:
        "Which operation on strings typically takes O(n) time in JavaScript?",
      options: [
        "Char access by index",
        "Concatenation",
        "Slicing",
        "Finding substring",
      ],
      correct: 3,
      explanation:
        "Finding a substring (indexOf, includes) requires scanning, which is O(n).",
    },
    {
      id: "strings-8",
      question: "What is 'anagram' detection about?",
      options: [
        "Checking palindrome",
        "Checking if two strings have same characters in any order",
        "Finding longest substring",
        "Reversing string",
      ],
      correct: 1,
      explanation:
        "Anagrams have the same characters with same frequencies but in different orders.",
    },
    {
      id: "strings-9",
      question:
        "Which character encoding is commonly used in modern JavaScript strings?",
      options: ["ASCII only", "UTF-16", "UTF-8", "Unicode (UTF-16 variations)"],
      correct: 3,
      explanation:
        "JavaScript uses UCS-2/UTF-16 encoding where strings are sequences of 16-bit code units.",
    },
    {
      id: "strings-10",
      question:
        "What is the best approach to check if a string is a valid number (like parseInt validation)?",
      options: [
        "Regular Expressions",
        "Try-catch with Number()",
        "Manual character iteration",
        "String methods only",
      ],
      correct: 0,
      explanation:
        "Regular expressions can pattern-match numeric formats efficiently and cleanly.",
    },
  ],
  linkedlist: [
    {
      id: "linkedlist-1",
      question:
        "What is the primary disadvantage of a singly linked list compared to an array?",
      options: [
        "Memory usage",
        "Random access time",
        "Insertion time",
        "Deletion time",
      ],
      correct: 1,
      explanation:
        "Linked lists require O(n) time to access an element by index, while arrays provide O(1) access.",
    },
    {
      id: "linkedlist-2",
      question:
        "What is the time complexity of inserting at the head of a singly linked list?",
      options: ["O(1)", "O(n)", "O(log n)", "O(1)"],
      correct: 0,
      explanation:
        "Insertion at head only requires updating a couple of pointers: O(1).",
    },
    {
      id: "linkedlist-3",
      question: "Which pointer(s) does a doubly linked list node contain?",
      options: ["Next only", "Prev only", "Both next and prev", "Neither"],
      correct: 2,
      explanation:
        "Doubly linked list nodes have pointers to both next and previous nodes for bidirectional traversal.",
    },
    {
      id: "linkedlist-4",
      question: "How do you detect a cycle in a linked list efficiently?",
      options: [
        "Hash set visited nodes",
        "Floyd's Tortoise and Hare",
        "Count nodes",
        "Reverse the list",
      ],
      correct: 1,
      explanation:
        "Floyd's cycle detection (fast and slow pointers) uses O(1) space and O(n) time.",
    },
    {
      id: "linkedlist-5",
      question:
        "What is the time complexity of reversing a singly linked list?",
      options: ["O(1)", "O(n)", "O(n^2)", "O(log n)"],
      correct: 1,
      explanation:
        "Reversing a linked list requires traversing all n nodes once, making it O(n).",
    },
    {
      id: "linkedlist-6",
      question:
        "Which problem asks to find the nth node from the end of a linked list?",
      options: [
        "Find middle node",
        "Remove duplicates",
        "Find nth from end",
        "Reverse list",
      ],
      correct: 2,
      explanation:
        '"Nth node from the end" is a classic problem solved using two pointers with a gap of n.',
    },
    {
      id: "linkedlist-7",
      question: "In a circular linked list, the last node points to:",
      options: ["null", "First node", "Middle node", "Any random node"],
      correct: 1,
      explanation:
        "Circular linked list's last node connects back to the first (head), forming a loop.",
    },
    {
      id: "linkedlist-8",
      question:
        "What is the space complexity of merging two sorted linked lists?",
      options: ["O(1)", "O(n+m)", "O(log n)", "O(n)"],
      correct: 0,
      explanation:
        "Merging sorted linked lists can be done by rearranging pointers, using O(1) extra space.",
    },
    {
      id: "linkedlist-9",
      question:
        "Which technique is used to find the intersection point of two linked lists?",
      options: [
        "Hash set",
        "Two pointers with length difference",
        "Recursion",
        "Stack",
      ],
      correct: 1,
      explanation:
        "Find lengths, advance longer list by difference, then move both pointers together until they meet.",
    },
    {
      id: "linkedlist-10",
      question:
        "What is a sentinel/dummy node used for in linked list problems?",
      options: [
        "Store extra data",
        "Simplify edge cases",
        "Increase speed",
        "Reduce memory",
      ],
      correct: 1,
      explanation:
        "Dummy nodes avoid handling head/ tail edge cases separately, making code cleaner.",
    },
  ],
  trees: [
    {
      id: "trees-1",
      question:
        "What is the maximum number of children a binary tree node can have?",
      options: ["1", "2", "3", "Unlimited"],
      correct: 1,
      explanation:
        "Binary tree nodes have at most two children: left and right.",
    },
    {
      id: "trees-2",
      question: "What is the time complexity of searching in a balanced BST?",
      options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
      correct: 2,
      explanation:
        "Balanced BSTs maintain O(log n) height, enabling logarithmic-time search.",
    },
    {
      id: "trees-3",
      question:
        "Which traversal visits nodes in the order: Left → Root → Right?",
      options: ["Pre-order", "In-order", "Post-order", "Level-order"],
      correct: 1,
      explanation:
        "In-order traversal processes left subtree, then root, then right subtree.",
    },
    {
      id: "trees-4",
      question: "What property must a Binary Search Tree (BST) satisfy?",
      options: [
        "All left descendants ≤ node < all right descendants",
        "All levels fully filled",
        "No cycles",
        "All nodes have two children",
      ],
      correct: 0,
      explanation:
        "BST invariant: left subtree values ≤ node value < right subtree values.",
    },
    {
      id: "trees-5",
      question: "How do you find the height of a binary tree?",
      options: [
        "Count nodes",
        "Max depth from root to leaf",
        "Count leaf nodes",
        "Balance factor",
      ],
      correct: 1,
      explanation:
        "Tree height is the number of edges on the longest path from root to leaf.",
    },
    {
      id: "trees-6",
      question: "What is the Lowest Common Ancestor (LCA) of two nodes?",
      options: [
        "Deepest node common to both root paths",
        "Smallest value node",
        "First common parent",
        "Root node",
      ],
      correct: 0,
      explanation: "LCA is the deepest node that is an ancestor of both nodes.",
    },
    {
      id: "trees-7",
      question: "Which tree traversal uses a queue?",
      options: ["DFS", "BFS (Level-order)", "In-order", "Pre-order"],
      correct: 1,
      explanation:
        "Breadth-First Search (Level-order) uses a queue to process nodes level by level.",
    },
    {
      id: "trees-8",
      question: "What is a complete binary tree?",
      options: [
        "All levels fully filled except possibly last, left-aligned",
        "All nodes have two children",
        "Perfectly balanced",
        "Sorted values",
      ],
      correct: 0,
      explanation:
        "Complete binary tree has all levels filled except last, and nodes are as far left as possible.",
    },
    {
      id: "trees-9",
      question: "Which tree is used to implement a priority queue efficiently?",
      options: ["Binary Tree", "BST", "Heap", "Trie"],
      correct: 2,
      explanation:
        "Heaps (typically binary heaps) provide O(log n) insert and extract-max/min operations.",
    },
    {
      id: "trees-10",
      question: "What does it mean for a tree to be 'balanced'?",
      options: [
        "All leaf nodes at same level",
        "Height difference of subtrees ≤ 1 for every node",
        "No cycles",
        "All nodes have 0 or 2 children",
      ],
      correct: 1,
      explanation:
        "Balanced tree means for each node, heights of left/right subtrees differ by at most 1 (e.g., AVL tree).",
    },
  ],
  graphs: [
    {
      id: "graphs-1",
      question: "What are the two main ways to represent a graph?",
      options: [
        "Matrix and Vector",
        "Adjacency List and Adjacency Matrix",
        "Edge list and Tree",
        "DFS and BFS",
      ],
      correct: 1,
      explanation:
        "Adjacency list (space-efficient) and adjacency matrix (O(1) edge lookup) are standard representations.",
    },
    {
      id: "graphs-2",
      question: "Which algorithm finds shortest path on unweighted graphs?",
      options: ["DFS", "BFS", "Dijkstra", "Bellman-Ford"],
      correct: 1,
      explanation:
        "BFS explores nodes level by level, naturally finding shortest path in unweighted graphs.",
    },
    {
      id: "graphs-3",
      question: "What is a directed graph?",
      options: [
        "Edges have no direction",
        "Edges have direction",
        "Edges are weighted",
        "Edges are undirected",
      ],
      correct: 1,
      explanation:
        "Directed graphs (digraphs) have edges with direction, indicating one-way relationships.",
    },
    {
      id: "graphs-4",
      question: "What is a cycle in a graph?",
      options: [
        "Path from node to itself",
        "Tree structure",
        "Path visiting all nodes",
        "Disconnected component",
      ],
      correct: 0,
      explanation:
        "A cycle is a path that starts and ends at the same vertex without repeating edges.",
    },
    {
      id: "graphs-5",
      question: "Which algorithm detects cycles in a directed graph?",
      options: ["BFS", "DFS with recursion stack", "Dijkstra", "Kruskal"],
      correct: 1,
      explanation:
        "DFS tracks recursion stack to detect back edges, indicating cycles in directed graphs.",
    },
    {
      id: "graphs-6",
      question: "What is topological sort used for?",
      options: [
        "Shortest path",
        "Task scheduling with dependencies",
        "Cycle detection",
        "Finding connected components",
      ],
      correct: 1,
      explanation:
        "Topological sort orders tasks so each comes before its dependencies (e.g., course prerequisites).",
    },
    {
      id: "graphs-7",
      question: "Which data structure does Dijkstra's algorithm use?",
      options: ["Stack", "Queue", "Priority Queue / Min-Heap", "Hash Set"],
      correct: 2,
      explanation:
        "Dijkstra uses a min-heap to always expand the node with smallest tentative distance.",
    },
    {
      id: "graphs-8",
      question: "What is a 'connected component' in an undirected graph?",
      options: [
        "Single node",
        "Maximal set where every pair connected by path",
        "Complete subgraph",
        "Tree structure",
      ],
      correct: 1,
      explanation:
        "Connected component is a maximal set of nodes where each node is reachable from every other.",
    },
    {
      id: "graphs-9",
      question: "Which algorithm finds the Minimum Spanning Tree (MST)?",
      options: [
        "Dijkstra",
        "Prim's or Kruskal's",
        "Bellman-Ford",
        "Floyd-Warshall",
      ],
      correct: 1,
      explanation:
        "Prim's and Kruskal's algorithms both find MST — a tree connecting all nodes with minimum total edge weight.",
    },
    {
      id: "graphs-10",
      question:
        "What is the time complexity of BFS on a graph with V vertices and E edges using adjacency list?",
      options: ["O(V)", "O(E)", "O(V + E)", "O(V * E)"],
      correct: 2,
      explanation:
        "BFS visits every vertex once and explores every edge once: O(V + E).",
    },
  ],
  dp: [
    {
      id: "dp-1",
      question:
        "What are the two key properties needed for Dynamic Programming?",
      options: [
        "Greedy and Divide & Conquer",
        "Optimal substructure and overlapping subproblems",
        "Recursion and memoization",
        "Iteration and base cases",
      ],
      correct: 1,
      explanation:
        "DP requires optimal substructure (solution contains optimal subsolutions) and overlapping subproblems.",
    },
    {
      id: "dp-2",
      question: "What is memoization in DP?",
      options: [
        "Bottom-up tabulation",
        "Top-down caching of results",
        "Greedy choice",
        "Iterative approach",
      ],
      correct: 1,
      explanation:
        "Memoization stores results of expensive function calls to avoid recomputation (top-down DP).",
    },
    {
      id: "dp-3",
      question: "What is tabulation in DP?",
      options: [
        "Top-down recursive memoization",
        "Bottom-up iterative table filling",
        "Greedy approach",
        "Divide and conquer",
      ],
      correct: 1,
      explanation:
        "Tabulation builds DP table iteratively from base cases upward (bottom-up).",
    },
    {
      id: "dp-4",
      question:
        "The Fibonacci sequence can be computed using DP in what time complexity?",
      options: ["O(2^n) naive recursion", "O(n) DP", "O(log n)", "O(1)"],
      correct: 1,
      explanation:
        "DP Fibonacci computes in O(n) by storing previous two values, vs O(2^n) naive recursion.",
    },
    {
      id: "dp-5",
      question:
        "Which classic DP problem asks: given n stairs, how many ways to reach top taking 1 or 2 steps?",
      options: [
        "Coin Change",
        "Climbing Stairs",
        "House Robber",
        "Longest Increasing Subsequence",
      ],
      correct: 1,
      explanation:
        "Climbing Stairs is essentially Fibonacci: ways[n] = ways[n-1] + ways[n-2].",
    },
    {
      id: "dp-6",
      question: "What is the 'state' in DP?",
      options: [
        "Random number",
        "Set of variables defining subproblem",
        "Final answer",
        "Recursion depth",
      ],
      correct: 1,
      explanation:
        "DP state captures parameters that uniquely define a subproblem (e.g., index, remaining capacity).",
    },
    {
      id: "dp-7",
      question:
        "Which DP problem involves maximizing sum of non-adjacent houses?",
      options: [
        "Knapsack",
        "House Robber",
        "Longest Common Subsequence",
        "Edit Distance",
      ],
      correct: 1,
      explanation:
        "House Robber: cannot rob adjacent houses; dp[i] = max(dp[i-1], dp[i-2] + nums[i]).",
    },
    {
      id: "dp-8",
      question: "What is the time complexity of the classic 0/1 Knapsack DP?",
      options: ["O(n)", "O(nW) where W=capacity", "O(2^n)", "O(n^2)"],
      correct: 1,
      explanation:
        "0/1 Knapsack DP uses a 2D table of size n x W, giving O(nW) time and space.",
    },
    {
      id: "dp-9",
      question:
        "Which DP technique finds the longest increasing subsequence in O(n log n)?",
      options: [
        "Memoization",
        "Patience sorting with binary search",
        "Tabulation",
        "Recursion",
      ],
      correct: 1,
      explanation:
        "LIS can be optimized using patience sorting approach: maintain tails array, binary search for each element.",
    },
    {
      id: "dp-10",
      question: "What is Edit Distance (Levenshtein distance) about?",
      options: [
        "Sorting strings",
        "Minimum operations to convert one string to another",
        "Longest common substring",
        "String compression",
      ],
      correct: 1,
      explanation:
        "Edit distance computes minimum insertions, deletions, substitutions to transform string A into B.",
    },
  ],
};

// ===== DATA OBJECTS =====
const dsaTopics = [
  {
    id: 1,
    name: "Arrays",
    icon: "📊",
    description:
      "Learn array operations, manipulations, and common interview problems",
    difficulty: "Easy-Medium",
    theory:
      "Arrays are contiguous memory locations that store elements of the same type. They provide O(1) access time but fixed size.",
    problems: [
      "Two Sum",
      "Maximum Subarray",
      "Merge Intervals",
      "Product Except Self",
      "Spiral Matrix",
    ],
  },
  {
    id: 2,
    name: "Strings",
    icon: "🔤",
    description:
      "Master string algorithms, pattern matching, and string manipulation",
    difficulty: "Easy-Medium",
    theory:
      "Strings are arrays of characters. Key operations include concatenation, substring search, and pattern matching using algorithms like KMP.",
    problems: [
      "Longest Substring Without Repeating",
      "Valid Parentheses",
      "Palindrome Partitioning",
      "String to Integer",
      "Group Anagrams",
    ],
  },
  {
    id: 3,
    name: "Linked List",
    icon: "🔗",
    description:
      "Singly, doubly, and circular linked lists with traversal techniques",
    difficulty: "Medium",
    theory:
      "Linked lists are linear data structures where elements are linked using pointers. Allows dynamic size and efficient insertions/deletions.",
    problems: [
      "Reverse Linked List",
      "Detect Cycle",
      "Merge Two Sorted Lists",
      "Remove Nth From End",
      "Intersection of Two Lists",
    ],
  },
  {
    id: 4,
    name: "Trees",
    icon: "🌳",
    description:
      "Binary trees, BST, traversal algorithms, and tree-based problems",
    difficulty: "Medium-Hard",
    theory:
      "Trees are hierarchical structures. Binary trees have at most two children per node. BST maintains sorted order: left < root < right.",
    problems: [
      "Maximum Depth",
      "Validate BST",
      "Lowest Common Ancestor",
      "Serialize/Deserialize",
      "Path Sum",
    ],
  },
  {
    id: 5,
    name: "Graphs",
    icon: "🕸️",
    description:
      "Graph representations, traversal (BFS/DFS), shortest paths, and networks",
    difficulty: "Hard",
    theory:
      "Graphs consist of vertices connected by edges. Representations: adjacency list/matrix. Traversals: BFS (level-order) and DFS (depth-first).",
    problems: [
      "Clone Graph",
      "Number of Islands",
      "Course Schedule",
      "Word Ladder",
      "Network Delay Time",
    ],
  },
  {
    id: 6,
    name: "Dynamic Programming",
    icon: "🎯",
    description:
      "Recursion, memoization, tabulation, and optimization problems",
    difficulty: "Hard",
    theory:
      "DP breaks problems into overlapping subproblems. Stores solutions to avoid recomputation. Approaches: top-down (memoization) and bottom-up (tabulation).",
    problems: [
      "Climbing Stairs",
      "Coin Change",
      "Longest Increasing Subsequence",
      "Edit Distance",
      "House Robber",
    ],
  },
];

const practiceProblems = [
  {
    id: 1,
    title: "Two Sum",
    difficulty: "easy",
    tags: ["Arrays", "Hash Table"],
    acceptance: "48.2%",
    category: "arrays",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers that add up to target. You may assume exactly one solution exists, and you may not use the same element twice. Return the answer in any order.",
    constraints: ["2 ≤ nums.length ≤ 10⁴", "-10⁹ ≤ nums[i] ≤ 10⁹", "Only one valid answer exists"],
    followUp: "Can you solve it in O(n) time complexity?",
  },
  {
    id: 2,
    title: "Valid Parentheses",
    difficulty: "easy",
    tags: ["Strings", "Stack"],
    acceptance: "40.2%",
    category: "strings",
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. A string is valid if every open bracket is closed by the same type of bracket in the correct order.",
    constraints: ["1 ≤ s.length ≤ 10⁴", "s consists of parentheses only '()[]{}'"],
    followUp: "Can you solve it in O(n) time and O(n) space?",
  },
  {
    id: 3,
    title: "Merge Two Sorted Lists",
    difficulty: "easy",
    tags: ["Linked List", "Recursion"],
    acceptance: "58.5%",
    category: "linkedlist",
  },
  {
    id: 4,
    title: "Maximum Subarray",
    difficulty: "medium",
    tags: ["Arrays", "Divide & Conquer"],
    acceptance: "46.2%",
    category: "arrays",
  },
  {
    id: 5,
    title: "LRU Cache",
    difficulty: "medium",
    tags: ["Design", "Hash Table"],
    acceptance: "37.5%",
    category: "arrays",
  },
  {
    id: 6,
    title: "Clone Graph",
    difficulty: "medium",
    tags: ["Graphs", "DFS", "BFS"],
    acceptance: "43.2%",
    category: "graphs",
  },
  {
    id: 7,
    title: "Longest Increasing Subsequence",
    difficulty: "hard",
    tags: ["DP", "Binary Search"],
    acceptance: "42.1%",
    category: "dp",
  },
  {
    id: 8,
    title: "Word Ladder",
    difficulty: "hard",
    tags: ["Graphs", "BFS"],
    acceptance: "31.4%",
    category: "graphs",
  },
  {
    id: 9,
    title: "Trapping Rain Water",
    difficulty: "hard",
    tags: ["Arrays", "Two Pointers"],
    acceptance: "48.7%",
    category: "arrays",
  },
  {
    id: 10,
    title: "Reverse Linked List",
    difficulty: "easy",
    tags: ["Linked List"],
    acceptance: "72.1%",
    category: "linkedlist",
  },
  {
    id: 11,
    title: "Invert Binary Tree",
    difficulty: "easy",
    tags: ["Trees", "DFS"],
    acceptance: "68.5%",
    category: "trees",
  },
  {
    id: 12,
    title: "Validate BST",
    difficulty: "medium",
    tags: ["Trees", "Recursion"],
    acceptance: "28.4%",
    category: "trees",
  },
  {
    id: 13,
    title: "Number of Islands",
    difficulty: "medium",
    tags: ["Graphs", "DFS"],
    acceptance: "54.8%",
    category: "graphs",
  },
  {
    id: 14,
    title: "House Robber",
    difficulty: "medium",
    tags: ["DP", "Arrays"],
    acceptance: "42.3%",
    category: "dp",
  },
  {
    id: 15,
    title: "Course Schedule",
    difficulty: "medium",
    tags: ["Graphs", "Topological Sort"],
    acceptance: "44.7%",
    category: "graphs",
  },
];

const chatbotResponses = {
  "time complexity":
    "Time complexity measures how an algorithm's runtime grows with input size. Common complexities: O(1) constant, O(log n) logarithmic, O(n) linear, O(n log n) linearithmic, O(n²) quadratic, O(2^n) exponential.",
  "space complexity":
    "Space complexity measures memory usage relative to input size. Aim for O(1) or O(n) space. In-place algorithms modify input directly.",
  arrays:
    "Arrays provide O(1) random access but fixed size. Use when you need fast lookups and index-based access. Key operations: insert O(n), delete O(n), search O(n) unsorted / O(log n) binary search on sorted arrays.",
  "linked list":
    "Linked lists offer O(1) insertion/deletion at any position but O(n) access time. Use when frequent insertions/deletions needed. Types: singly (one pointer), doubly (two pointers), circular (last points to first).",
  tree: "Trees are hierarchical. Binary trees: each node has ≤2 children. BST: left < root < right. Balanced (AVL, Red-Black) ensure O(log n) operations. Traversals: inorder (left-root-right), preorder (root-left-right), postorder (left-right-root).",
  graph:
    "Graphs represent networks. Directed vs undirected, weighted vs unweighted, cyclic vs acyclic. Representations: adjacency list (space-efficient) vs adjacency matrix (O(1) edge lookup). Traversals: BFS (shortest path on unweighted graphs), DFS (cycle detection, topological sort).",
  "dynamic programming":
    "DP solves problems with optimal substructure & overlapping subproblems. Memoization (top-down) caches recursive calls. Tabulation (bottom-up) fills DP table iteratively. Steps: identify state, recurrence, base cases. Classic problems: Fibonacci, Knapsack, LCS, LIS, Coin Change.",
  greedy:
    "Greedy algorithms make locally optimal choices hoping for global optimum. Works when greedy choice property holds. Examples: Dijkstra's shortest path, Huffman coding, activity selection.",
  sorting:
    "Common sorting algorithms: Bubble O(n²), Selection O(n²), Insertion O(n²) (good for small/nearly sorted), Merge O(n log n) stable, Quick O(n log n) average, Heap O(n log n) in-place, Counting O(n+k) for bounded range, Radix O(d(n+b)).",
  "binary search":
    "Binary search on sorted arrays: repeatedly divide search interval in half. Time O(log n). Template: low=0, high=n-1; while low≤high: mid=(low+high)/2; if target=arr[mid] return; else adjust bounds.",
  recursion:
    "Recursion solves problems by breaking into smaller subproblems. Base case stops recursion. Recursive case calls function with smaller input. Use for tree traversals, backtracking, divide & conquer. Watch stack overflow for deep recursion.",
  "big o":
    "Big O describes upper bound of growth rate. Best, average, worst cases differ. Common: O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2^n) < O(n!). Space complexity also matters.",
  bfs: "Breadth-First Search explores all neighbors before moving deeper. Use queue. Applications: shortest path (unweighted), level-order traversal, web crawling, social networks (degrees of separation).",
  dfs: "Depth-First Search goes deep before backtracking. Use stack (explicit or recursion). Applications: cycle detection, topological sort, connected components, maze solving. Three tree traversals: inorder, preorder, postorder.",
  "system design":
    "System design involves scaling systems. Key concepts: load balancers, caching (Redis), databases (SQL vs NoSQL), CDNs, message queues, microservices, replication, sharding, CAP theorem, consistency models. Start with requirements, then high-level design, deep dive on components.",
  "object oriented design":
    "OOD principles: encapsulation (data hiding), inheritance (code reuse), polymorphism (same interface, different implementations), abstraction (simplify complexity). Design patterns: Singleton, Factory, Observer, Strategy, Decorator, Adapter.",
  api: "API (Application Programming Interface) defines how software components interact. RESTful APIs use HTTP verbs (GET, POST, PUT, DELETE), stateless, resource-based. GraphQL allows flexible queries. Design for scalability, versioning, authentication, rate limiting.",
  sql: "SQL (Structured Query Language) manages relational databases. Key commands: SELECT (retrieve), INSERT (add), UPDATE (modify), DELETE (remove), JOIN (combine tables), GROUP BY (aggregate), WHERE (filter), ORDER BY (sort). Indexes speed up reads.",
  cache:
    "Cache stores frequently accessed data in faster storage (memory). Strategies: LRU (least recently used), LFU (least frequently used). Cache aside, write-through, write-back patterns. Cache invalidation is critical. Redis, Memcached implementations.",
  default:
    "I can help with DSA topics, coding problems, system design, interview tips, and career advice. Try asking about specific algorithms, data structures, time complexity, or problem-solving strategies!",
};

// ===== STATE MANAGEMENT =====
let userProgress = {
  name: "Learner",
  avatar: "🚀",
  completedProblems: [],

  favoriteProblems: [],//here i have added a new property to store the user's favorite problems
  recentProblems: [], //here i have added a new property to store the user's recent problems

  favoriteProblems: [], //here i have added a new property to store the user's favorite problems
  problemNotes: {},

  xp: 0,
  level: 1,
  streak: 0,
  badges: [],
  lastActive: null,
  quizScores: {}, // topic -> { bestScore, attempts, totalXP }
};

applySavedTheme();

// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded fired, initializing app...");
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
  initChatbot();
  initProfile();
  initDarkMode();
  initNewsletterValidation();
  initScrollEffects();

  // Update profile display after loading
  updateProfile();
  console.log("App initialization complete");

  // Language change handler for code editor
  const langSelect = document.getElementById("languageSelect");
  if (langSelect) {
    langSelect.addEventListener("change", () => {
      if (currentProblem) {
        const editor = document.getElementById("codeEditor");
        editor.value = getDefaultCode(langSelect.value, currentProblem);
        editor.dispatchEvent(new Event("input"));
      }
    });
  }

  // Modal close handlers
  const modalClose = document.getElementById("modalClose");
  if (modalClose) {
    modalClose.addEventListener("click", closeTopicModal);
  }

  const topicModal = document.getElementById("topicModal");
  if (topicModal) {
    topicModal.addEventListener("click", (e) => {
      if (e.target === topicModal) {
        closeTopicModal();
      }
    });
  }

  // Original Quiz Editor Modal (coding problems) close handlers
  const quizEditorCloseBtn = document.getElementById("quizModalClose");
  if (quizEditorCloseBtn) {
    quizEditorCloseBtn.addEventListener("click", closeQuizEditor);
  }

  const quizEditorModal = document.getElementById("quizEditorModal");
  if (quizEditorModal) {
    quizEditorModal.addEventListener("click", (e) => {
      if (e.target === quizEditorModal) {
        closeQuizEditor();
      }
    });
  }

  // New Topic Quiz Modal close handlers
  const topicQuizCloseBtn = document.getElementById("topicQuizModalClose");
  if (topicQuizCloseBtn) {
    topicQuizCloseBtn.addEventListener("click", closeQuizModal);
  }

  const topicQuizModal = document.getElementById("quizModal");
  if (topicQuizModal) {
    topicQuizModal.addEventListener("click", (e) => {
      if (e.target === topicQuizModal) {
        closeQuizModal();
      }
    });
  }
});

// ===== LOADING SCREEN =====
function initLoadingScreen() {
  setTimeout(() => {
    document.getElementById("loading-screen").classList.add("hidden");
    initializeAnimations();
  }, 2000);
}

// ===== NAVBAR =====
function initNavbar() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
    const icon = menuToggle.querySelector("i");
    icon.classList.toggle("fa-bars");
    icon.classList.toggle("fa-times");
  });

  // Close menu on link click
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("active");
      const icon = menuToggle.querySelector("i");
      icon.classList.add("fa-bars");
      icon.classList.remove("fa-times");
    });
  });

  // Scroll effect
  window.addEventListener("scroll", () => {
    const navbar = document.querySelector(".navbar");
    if (window.scrollY > 100) {
      navbar.style.background = "rgba(10, 10, 26, 0.95)";
    } else {
      navbar.style.background = "rgba(10, 10, 26, 0.8)";
    }
  });
}

// ===== HERO SECTION =====
function initHeroSection() {
  // Typing animation
  const typingElement = document.getElementById("typingText");
  const texts = [
    "Arrays",
    "Linked Lists",
    "Trees",
    "Graphs",
    "Dynamic Programming",
    "System Design",
  ];
  let textIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function typeEffect() {
    const currentText = texts[textIndex];

    if (isDeleting) {
      typingElement.textContent = currentText.substring(0, charIndex - 1);
      charIndex--;
    } else {
      typingElement.textContent = currentText.substring(0, charIndex + 1);
      charIndex++;
    }

    let typeSpeed = isDeleting ? 50 : 100;

    if (!isDeleting && charIndex === currentText.length) {
      typeSpeed = 2000;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      textIndex = (textIndex + 1) % texts.length;
      typeSpeed = 500;
    }

    setTimeout(typeEffect, typeSpeed);
  }

  typeEffect();

  // Animate stats
  const statNumbers = document.querySelectorAll(".stat-number");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateValue(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 },
  );

  statNumbers.forEach((stat) => observer.observe(stat));
}

function animateValue(element) {
  const target = parseInt(element.getAttribute("data-target"));
  const duration = 2000;
  const increment = target / (duration / 16);
  let current = 0;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    element.textContent = Math.ceil(current).toLocaleString();
  }, 16);
}

// ===== PROFILE EDITING =====
let selectedAvatar = "🚀";

const avatarOptions = [
  "🚀",
  "🌟",
  "🔥",
  "💎",
  "🎯",
  "🧠",
  "⚡",
  "🦄",
  "🐉",
  "🔮",
  "🎨",
  "🎭",
];

function initProfileEdit() {
  try {
    console.log("Initializing profile edit");
    const avatarContainer = document.getElementById("avatarOptions");
    if (!avatarContainer) {
      console.warn("Avatar options container not found");
      return;
    }

    const currentAvatar = userProgress.avatar || "🚀";
    console.log("Current avatar:", currentAvatar);

    avatarContainer.innerHTML = avatarOptions
      .map(
        (avatar) => `
            <div class="avatar-option ${avatar === currentAvatar ? "selected" : ""}"
                 data-avatar="${avatar}">${avatar}</div>
        `,
      )
      .join("");

    avatarContainer.querySelectorAll(".avatar-option").forEach((opt) => {
      opt.addEventListener("click", () => {
        avatarContainer
          .querySelectorAll(".avatar-option")
          .forEach((o) => o.classList.remove("selected"));
        opt.classList.add("selected");
        selectedAvatar = opt.dataset.avatar;
        console.log("Selected avatar:", selectedAvatar);
      });
    });

    const nameInput = document.getElementById("profileNameInput");
    if (nameInput) {
      nameInput.value = userProgress.name || "Learner";
    }

    selectedAvatar = currentAvatar;
    console.log("Profile edit initialized");
  } catch (error) {
    console.error("Error in initProfileEdit:", error);
  }
}

function openProfileModal() {
  try {
    console.log("Opening profile modal");
    const modal = document.getElementById("profileEditModal");
    if (!modal) {
      console.error("Profile edit modal not found");
      return;
    }
    initProfileEdit();
    modal.classList.add("active");
    console.log("Profile modal opened");
  } catch (error) {
    console.error("Error opening profile modal:", error);
  }
}

function closeProfileModal() {
  const modal = document.getElementById("profileEditModal");
  if (modal) modal.classList.remove("active");
}

function saveProfileChanges() {
  const nameInput = document.getElementById("profileNameInput");
  const newName = nameInput.value.trim() || "Learner";

  userProgress.name = newName;
  userProgress.avatar = selectedAvatar;

  saveUserData();
  updateProfile();
  closeProfileModal();
  showNotification("Profile updated successfully!", "success");
}

// Profile click handler
document.addEventListener("click", (e) => {
  if (e.target.closest(".profile-edit-btn")) {
    console.log("Profile edit button clicked");
    openProfileModal();
  }
});

// Profile modal close
document.addEventListener("click", (e) => {
  if (e.target.closest("#profileModalClose")) {
    closeProfileModal();
  }
  const modal = document.getElementById("profileEditModal");
  if (modal && e.target === modal) {
    closeProfileModal();
  }
});

function getTopicProgress(topicName) {
  // Map topic names to category keys used in practiceProblems
  const categoryMap = {
      "Arrays": "arrays",
      "Strings": "strings",
      "Linked List": "linkedlist",
      "Trees": "trees",
      "Graphs": "graphs",
      "Dynamic Programming": "dp"
  };

  const category = categoryMap[topicName];
  if (!category) return { completed: 0, total: 0, percentage: 0 };

  const topicProblems = practiceProblems.filter(p => p.category === category);
  const total = topicProblems.length;
  if (total === 0) return { completed: 0, total: 0, percentage: 0 };

  const completed = topicProblems.filter(p =>
      userProgress.completedProblems.includes(p.id)
  ).length;

  const percentage = Math.round((completed / total) * 100);
  return { completed, total, percentage };
}

// ===== TOPICS SECTION =====
function getDailyTopic() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const index = dayOfYear % dsaTopics.length;
  return dsaTopics[index];
}

function initTopicOfTheDay() {
  const topic = getDailyTopic();
  if (!topic) return;

  document.getElementById('totdIcon').textContent = topic.icon;
  document.getElementById('totdTitle').textContent = topic.name;
  document.getElementById('totdDesc').textContent = topic.description;

  const diffEl = document.getElementById('totdDifficulty');
  diffEl.textContent = topic.difficulty;
  diffEl.className = `totd-difficulty difficulty-badge ${getDifficultyClass(topic.difficulty)}`;

  const progress = getTopicProgress(topic.name);
  document.getElementById('totdProblems').textContent =
      `${progress.completed}/${progress.total} solved`;

  document.getElementById('totdBtn').addEventListener('click', () => {
      openTopicModal(topic);
  });
}

function initTopicsSection() {
  const topicsGrid = document.querySelector(".topics-grid");
  topicsGrid.innerHTML = '';
  dsaTopics.forEach((topic, index) => {
    const card = document.createElement("div");
    card.className = "topic-card animate-in";
    card.style.animationDelay = `${index * 0.1}s`;
    const progress = getTopicProgress(topic.name);

    card.innerHTML = `
        <div class="topic-icon">${topic.icon}</div>
        <h3 class="topic-name">${topic.name}</h3>
        <p class="topic-desc">${topic.description}</p>
        <div class="topic-meta">
            <span class="difficulty-badge ${getDifficultyClass(topic.difficulty)}">${topic.difficulty}</span>
            <span class="topic-count">${progress.total} problems</span>
        </div>
        <div class="topic-mastery">
            <div class="mastery-header">
                <span class="mastery-label">Progress</span>
                <span class="mastery-stats">${progress.completed}/${progress.total} solved</span>
            </div>
            <div class="mastery-bar" role="progressbar" aria-valuenow="${progress.percentage}" aria-valuemin="0" aria-valuemax="100" aria-label="${topic.name} mastery progress">
                <div class="mastery-fill" style="width: ${progress.percentage}%"></div>
            </div>
            </div>
            <div class="mastery-bar" role="progressbar" aria-valuenow="${progress.percentage}" aria-valuemin="0" aria-valuemax="100" aria-label="${topic.name} mastery progress">
                <div class="mastery-fill" style="width: ${progress.percentage}%"></div>
            </div>
            <span class="mastery-percentage">${progress.percentage}%</span>
        </div>
    `;

    topicsGrid.appendChild(card);

    card.addEventListener("click", () => {
      openTopicModal(topic);
    });
  });
}

function getDifficultyClass(difficulty) {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return "easy";
    case "medium":
      return "medium";
    case "hard":
      return "hard";
    default:
      return "medium";
  }
}

// Get quiz topic key from topic object
function getQuizTopicKey(topic) {
  const name = topic.name.toLowerCase();
  // Map topic names to quiz keys
  const keyMap = {
    arrays: "arrays",
    strings: "strings",
    "linked list": "linkedlist",
    trees: "trees",
    graphs: "graphs",
    "dynamic programming": "dp",
  };
  return keyMap[name] || name.replace(/\s+/g, "");
}
function initQuizSection() {
  try {
    console.log("Initializing Quiz Section...");
    const quizGrid = document.querySelector(".quiz-grid");
    if (!quizGrid) {
      console.warn("Quiz grid element not found");
      return;
    }
    console.log("Quiz grid found, topics count:", dsaTopics.length);

    dsaTopics.forEach((topic, index) => {
      const topicKey = getQuizTopicKey(topic);
      console.log(`Creating quiz card for ${topic.name} (key: ${topicKey})`);
      const card = document.createElement("div");
      card.className = "quiz-card animate-in";
      card.style.animationDelay = `${index * 0.1}s`;
      card.innerHTML = `
                <div class="quiz-card-icon">${topic.icon}</div>
                <h3 class="quiz-card-title">${topic.name}</h3>
                <p class="quiz-card-desc">Test your knowledge with 10 unique questions</p>
                <div class="quiz-card-meta">
                    <span class="quiz-count">10 Questions</span>
                    <span class="quiz-difficulty ${getDifficultyClass(topic.difficulty)}">${topic.difficulty}</span>
                </div>
                <div class="quiz-progress-bar">
                    <div class="quiz-progress-fill" id="progress-${topicKey}"></div>
                </div>
                <div class="quiz-stats">
                    <span>Best: <strong id="best-${topicKey}">--</strong></span>
                    <span>Attempts: <strong id="attempts-${topicKey}">0</strong></span>
                </div>
                <button class="btn btn-primary start-quiz-btn" data-topic="${topicKey}">
                    <i class="fas fa-play"></i> Start Quiz
                </button>
            `;
      quizGrid.appendChild(card);
      console.log(`Quiz card created for ${topic.name}`);

      // Update progress display
      updateQuizProgressDisplay(topic);

      // Add click handler
      const startBtn = card.querySelector(".start-quiz-btn");
      if (startBtn) {
        startBtn.addEventListener("click", () => {
          console.log(`Start Quiz clicked for ${topic.name}`);
          startQuiz(topic);
        });
      } else {
        console.error("Start quiz button not found for topic:", topic.name);
      }
    });
    console.log("Quiz Section initialization complete");
  } catch (error) {
    console.error("Error initializing quiz section:", error);
  }
}

function updateQuizProgressDisplay(topic) {
  const topicKey = getQuizTopicKey(topic);
  const progressFill = document.getElementById(`progress-${topicKey}`);
  const bestScoreEl = document.getElementById(`best-${topicKey}`);
  const attemptsEl = document.getElementById(`attempts-${topicKey}`);

  if (!progressFill || !bestScoreEl || !attemptsEl) return;

  const quizData = userProgress.quizScores[topicKey] || {
    bestScore: 0,
    attempts: 0,
    totalXP: 0,
  };
  const progressPercent = quizData.attempts > 0 ? 100 : 0; // Full bar if attempted, empty otherwise

  progressFill.style.width = `${progressPercent}%`;
  bestScoreEl.textContent = `${quizData.bestScore}%`;
  attemptsEl.textContent = quizData.attempts;
}

function startQuiz(topic) {
  const topicKey = getQuizTopicKey(topic);
  const questions = quizQuestions[topicKey];

  if (!questions || questions.length === 0) {
    showNotification(
      "No quiz questions available for this topic yet!",
      "error",
    );
    return;
  }

  currentQuiz = {
    topic: topic,
    questions: shuffleArray([...questions]),
    currentQuestionIndex: 0,
    score: 0,
    answers: [],
  };

  // Set modal header info
  try {
    document.getElementById("topicQuizBadge").textContent = topic.name;
    document.getElementById("topicQuizDifficulty").textContent =
      topic.difficulty;
    document.getElementById("topicQuizTitle").textContent =
      `${topic.name} Quiz`;

    // Hide previous results
    const prevResult = document.getElementById("topicQuizResult");
    if (prevResult) prevResult.classList.add("hidden");
  } catch (e) {
    console.error("Error setting quiz modal header:", e);
    return;
  }

  openQuizModal();
  renderQuizQuestion();
}

// Fisher-Yates shuffle
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Quiz Modal
let currentQuiz = null;

function openQuizModal() {
  try {
    const modal = document.getElementById("quizModal");
    if (modal) {
      modal.classList.add("active");
    } else {
      console.error("Quiz modal element not found");
    }
  } catch (e) {
    console.error("Error opening quiz modal:", e);
  }
}

function closeQuizModal() {
  try {
    const modal = document.getElementById("quizModal");
    if (modal) modal.classList.remove("active");
  } catch (e) {
    console.error("Error closing quiz modal:", e);
  }
  currentQuiz = null;
}

function renderQuizQuestion() {
  if (
    !currentQuiz ||
    currentQuiz.currentQuestionIndex >= currentQuiz.questions.length
  ) {
    finishQuiz();
    return;
  }

  const question = currentQuiz.questions[currentQuiz.currentQuestionIndex];
  const questionEl = document.getElementById("topicQuizQuestionText");
  const optionsEl = document.getElementById("topicQuizOptions");
  const progressEl = document.getElementById("topicQuizProgress");
  const counterEl = document.getElementById("topicQuizCounter");

  if (questionEl)
    questionEl.textContent = `Q${currentQuiz.currentQuestionIndex + 1}: ${question.question}`;
  if (counterEl)
    counterEl.textContent = `${currentQuiz.currentQuestionIndex + 1} / ${currentQuiz.questions.length}`;
  if (progressEl)
    progressEl.style.width = `${((currentQuiz.currentQuestionIndex + 1) / currentQuiz.questions.length) * 100}%`;

  if (optionsEl) {
    optionsEl.innerHTML = question.options
      .map(
        (option, idx) => `
            <div class="quiz-option" data-index="${idx}">
                <span class="option-letter">${String.fromCharCode(65 + idx)}</span>
                <span class="option-text">${option}</span>
            </div>
        `,
      )
      .join("");

    // Add click handlers
    optionsEl.querySelectorAll(".quiz-option").forEach((opt) => {
      opt.addEventListener("click", () => {
        selectQuizAnswer(parseInt(opt.dataset.index));
      });
    });
  }
}

function selectQuizAnswer(selectedIndex) {
  const question = currentQuiz.questions[currentQuiz.currentQuestionIndex];
  const isCorrect = selectedIndex === question.correct;

  // Record answer
  currentQuiz.answers.push({
    questionId: question.id,
    selected: selectedIndex,
    correct: question.correct,
    isCorrect: isCorrect,
  });

  if (isCorrect) {
    currentQuiz.score++;
  }

  // Highlight selection
  const optionsEl = document.getElementById("topicQuizOptions");
  optionsEl.querySelectorAll(".quiz-option").forEach((opt, idx) => {
    opt.classList.add("selected");
    if (idx === question.correct) {
      opt.classList.add("correct");
    } else if (idx === selectedIndex && !isCorrect) {
      opt.classList.add("incorrect");
    }
    opt.style.pointerEvents = "none";
  });

  // Move to next question after delay
  setTimeout(() => {
    currentQuiz.currentQuestionIndex++;
    renderQuizQuestion();
  }, 1200);
}

function finishQuiz() {
  const topicKey = getQuizTopicKey(currentQuiz.topic);
  const score = currentQuiz.score;
  const total = currentQuiz.questions.length;
  const percentage = Math.round((score / total) * 100);

  // Update user progress
  if (!userProgress.quizScores[topicKey]) {
    userProgress.quizScores[topicKey] = {
      bestScore: 0,
      attempts: 0,
      totalXP: 0,
    };
  }

  const record = userProgress.quizScores[topicKey];
  record.attempts++;
  if (percentage > record.bestScore) {
    record.bestScore = percentage;
  }

  // Award XP
  const xpEarned = Math.round(score * 10); // 10 XP per correct answer
  addXP(xpEarned);
  record.totalXP += xpEarned;

  saveUserData();

  // Show results
  showQuizResults(score, total, percentage, xpEarned);

  // Update display
  updateQuizProgressDisplay(currentQuiz.topic);
  updateDashboard();
  updateGamification();

  setTimeout(() => {
    closeQuizModal();
    currentQuiz = null;
  }, 1500);
}

function showQuizResults(score, total, percentage, xpEarned) {
  const resultEl = document.getElementById("topicQuizResult");
  if (!resultEl) return;

  let message = "";
  let icon = "";

  if (percentage >= 90) {
    icon = "🏆";
    message = "Outstanding! Perfect mastery!";
  } else if (percentage >= 70) {
    icon = "🌟";
    message = "Great job! Solid understanding!";
  } else if (percentage >= 50) {
    icon = "👍";
    message = "Good effort! Keep practicing!";
  } else {
    icon = "📚";
    message = "Keep learning! Review the topic and try again!";
  }

  resultEl.innerHTML = `
        <div class="quiz-result-content">
            <div class="quiz-result-icon">${icon}</div>
            <h3>${message}</h3>
            <div class="quiz-score-circle">
                <span class="score-number">${percentage}%</span>
            </div>
            <p>You got <strong>${score}</strong> out of <strong>${total}</strong> questions correct</p>
            <p class="xp-gained">+${xpEarned} XP earned!</p>
        </div>
    `;

  resultEl.classList.remove("hidden");
}

// ===== PRACTICE SECTION =====
function initPracticeSection() {
  const problemsGrid = document.querySelector(".problems-grid");
  if (!problemsGrid) return;

  const notesCloseBtn = document.getElementById("notesModalClose");
  const notesCancelBtn = document.getElementById("notesCancelBtn");
  const notesSaveBtn = document.getElementById("notesSaveBtn");
  const notesModal = document.getElementById("notesModal");

  if (notesCloseBtn) {
    notesCloseBtn.addEventListener("click", closeNotesModal);
  }
  if (notesCancelBtn) {
    notesCancelBtn.addEventListener("click", closeNotesModal);
  }
  if (notesSaveBtn) {
    notesSaveBtn.addEventListener("click", saveProblemNotes);
  }
  if (notesModal) {
    notesModal.addEventListener("click", (e) => {
      if (e.target === notesModal) {
        closeNotesModal();
      }
    });
  }

  // Filter buttons
  const filterButtons = document.querySelectorAll(".filter-btn");
  let currentFilter = "all";

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      renderProblems(currentFilter);
    });
  });

  // Search bar
  const searchInput = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearSearchBtn");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const value = e.target.value.toLowerCase();

      renderProblems(currentFilter, value);

      // Show/hide clear button
      if (value.length > 0) {
        clearBtn.classList.add("visible");
      } else {
        clearBtn.classList.remove("visible");
      }
    });
  }

  // Clear search functionality
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      clearBtn.classList.remove("visible");

      renderProblems(currentFilter, "");

      searchInput.focus();
    });
  }

  // Initial render
  renderProblems("all");
}

function renderProblems(filter = "all", searchQuery = "") {
  const problemsGrid = document.querySelector(".problems-grid");
  if (!problemsGrid) return;

  let filteredProblems = practiceProblems.filter((problem) => {
    const matchesFilter =
      filter === "all" ||
      problem.difficulty === filter || //here we check if the problem matches the selected difficulty filter
      (filter === "favorites" &&
        userProgress.favoriteProblems.includes(problem.id));
    const matchesSearch =
      !searchQuery ||
      problem.title.toLowerCase().includes(searchQuery) ||
      problem.tags.some((tag) => tag.toLowerCase().includes(searchQuery));
    return matchesFilter && matchesSearch;
  });

  // Count updation functionality
  const visibleCountEl = document.getElementById("visible-count");
  const totalCountEl = document.getElementById("total-count");
  
  if (visibleCountEl && totalCountEl) {
    visibleCountEl.textContent = filteredProblems.length;
    totalCountEl.textContent = practiceProblems.length;
  }

  problemsGrid.innerHTML = filteredProblems
    .map(
      (problem) => `
        <div class="problem-card animate-in" data-id="${problem.id}">
            <div class="problem-header">
              <h3 class="problem-title">${problem.title}</h3>
               <div class="problem-actions">
               <button class="favorite-btn ${
                 //here we check if the problem is in the user's favorites and add the 'active' class to the button if it is
                 userProgress.favoriteProblems.includes(problem.id)
                   ? "active"
                   : ""
               }"
data-id="${problem.id}">
         <i class="fas fa-heart"></i>
     </button>

               <button class="notes-btn ${
                userProgress.problemNotes[problem.id] ? "active" : ""
              }" data-id="${problem.id}">
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
    `,
    )
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

// ===== ROADMAP =====
function initRoadmap() {
  const progressBar = document.getElementById("roadmapProgress");
  const stages = document.querySelectorAll(".stage");

  // Calculate progress based on completed problems
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

// ===== PROFILE =====
function initProfile() {
   var profileName = document.getElementById("profileName");
   if (profileName) {
     profileName.textContent = userProgress.name;
   }
   var joinDate = document.getElementById("joinDate");
   if (joinDate) {
     var today = new Date();
     joinDate.textContent = today.toLocaleDateString("en-US", {
       month: "long",
       day: "numeric",
       year: "numeric",
     });
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

  // Profile Section Streak
  var profileStreakSection = document.getElementById("profileStreakSection");
  if (profileStreakSection)
    profileStreakSection.textContent = userProgress.streak;

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
  var dashboardProfileName = document.getElementById("dashboardProfileName");
  if (dashboardProfileName) {
    dashboardProfileName.textContent = userProgress.name;
  }

  // Update profile name in profile section
  var profileSectionName = document.getElementById("profileSectionName");
  if (profileSectionName) {
    profileSectionName.textContent = userProgress.name;
  }

  // Update avatar
  var avatarIcon = document.querySelector(".avatar-icon");
  if (avatarIcon) {
    avatarIcon.textContent = userProgress.avatar || "🚀";
  }

  updateLevelProgress();
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

// ===== DASHBOARD =====
function initDashboard() {
  updateDashboard();
  updateProfile();
}

function updateDashboard() {
   document.getElementById("completedProblems").textContent =
     userProgress.completedProblems.length;
   document.getElementById("currentStreak").textContent = userProgress.streak;
   document.getElementById("totalXP").textContent = userProgress.xp;

   updateCurrentDate();
   updateActivityList();
   updateBadges();
   updateRecentProblems(); // Recently Viewed Problems
   updateLeaderboard();
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
    container.innerHTML =
      "<p>No recently viewed problems</p>";
    return;
  }

  container.innerHTML = userProgress.recentProblems
    .map((id) => {
      const problem = practiceProblems.find(
        (p) => p.id === id
      );

      if (!problem) return "";

      return `
        <div class="recent-problem" data-id="${problem.id}">
          ${problem.title}
        </div>
      `;
    })
    .join("");

  container.querySelectorAll(".recent-problem")
    .forEach((item) => {
      item.addEventListener("click", () => {
        const problemId = parseInt(item.dataset.id);

        const problem = practiceProblems.find(
          (p) => p.id === problemId
        );

        if (problem) {
          openQuizEditor(problem);
        }
      });
    });
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

  // Dashboard badges
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

  // Gamification section badges
  grid.innerHTML = badges
    .map(
      (badge) =>
        `<div class="badge-lg ${badge.earned ? "" : "locked"}" tabindex="0" aria-label="${badge.name}: ${badge.description}. ${badge.criteria}">
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

function updateLeaderboard() {
  const leaderboardList = document.getElementById("leaderboardList");

  // Mock leaderboard data
  const leaders = [
    { name: "CodeMaster", xp: 15420, rank: 1 },
    { name: "AlgoNinja", xp: 14890, rank: 2 },
    { name: "DevGuru", xp: 13200, rank: 3 },
    { name: "You", xp: userProgress.xp, rank: 4 },
    { name: "BinaryBeast", xp: 11500, rank: 5 },
  ];

  leaderboardList.innerHTML = leaders
    .map(
      (user) => `
        <div class="leaderboard-item ${user.name === "You" ? "current-user" : ""}" style="${user.name === "You" ? "border: 2px solid var(--primary);" : ""}">
            <span class="leader-rank">#${user.rank}</span>
            <span class="leader-name">${user.name}</span>
            <span class="leader-xp">${user.xp.toLocaleString()} XP</span>
        </div>
    `,
    )
    .join("");
}

// ===== GAMIFICATION =====
function initGamification() {
  updateXPBar();
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

  toggle.addEventListener("click", () => {
    windowEl.classList.toggle("hidden");
    toggle.querySelector(".chatbot-badge").style.display = "none";
  });

  close.addEventListener("click", () => {
    windowEl.classList.add("hidden");
  });

  function sendMessage() {
    const message = input.value.trim();
    if (!message) return;

    // Add user message
    addChatMessage(`<p>${message}</p>`, "user");

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
      addChatMessage(response, "bot");
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

function addChatMessage(message, sender) {
  const messagesContainer = document.getElementById("chatbotMessages");
  const messageEl = document.createElement("div");
  messageEl.className = `message ${sender}`;
  messageEl.innerHTML = message;
  messagesContainer.appendChild(messageEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function getBotResponse(question) {
  const q = question.toLowerCase();

  let response = chatbotResponses["default"];

  for (const key in chatbotResponses) {
    if (q.includes(key)) {
      response = chatbotResponses[key];
      break;
    }
  }

  return `
    <div class="assistant-response">
      <h4>🧠 Problem Understanding</h4>
      <p>${question}</p>

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
    </div>
  `;
}

// ===== SCROLL EFFECTS =====
function initScrollEffects() {
  const scrollTopBtn = document.getElementById("scrollTopBtn");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 500) {
      scrollTopBtn.classList.add("visible");
    } else {
      scrollTopBtn.classList.remove("visible");
    }
  });

  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

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

// ===== DARK MODE =====

function applySavedTheme() {
  const savedMode = localStorage.getItem("darkMode");

  if (savedMode === "light") {
    document.body.classList.add("light-mode");
  }
}


function initDarkMode() {
  const toggle = document.getElementById("darkModeToggle");
  if (!toggle) return;
  const icon = toggle.querySelector("i");

  // Check saved preference
  const savedMode = localStorage.getItem("darkMode");
  if (savedMode === "light") {
    document.body.classList.add("light-mode");
    icon.classList.remove("fa-moon");
    icon.classList.add("fa-sun");
  }

  toggle.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    const isLight = document.body.classList.contains("light-mode");
    icon.classList.toggle("fa-moon");
    icon.classList.toggle("fa-sun");
    localStorage.setItem("darkMode", isLight ? "light" : "dark");
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

// ===== LOCAL STORAGE =====
function saveUserData() {
  try {
    userProgress.lastActive = new Date().toISOString();
    localStorage.setItem("algoInfinityVerse", JSON.stringify(userProgress));
  } catch (error) {
    console.warn("Could not save user data to localStorage:", error);
  }
}

function loadUserData() {
  try {
    const saved = localStorage.getItem("algoInfinityVerse");
    if (saved) {
      const data = JSON.parse(saved);
      userProgress = { ...userProgress, ...data };

      // Ensure quizScores exists
      if (!userProgress.quizScores) {
        userProgress.quizScores = {};
      }
        if (!userProgress.recentProblems) {
          userProgress.recentProblems = [];
      }

      // Update streak if user was active yesterday
      if (userProgress.lastActive) {
        const lastActive = new Date(userProgress.lastActive);
        const today = new Date();
        const diffDays = Math.floor(
          (today - lastActive) / (1000 * 60 * 60 * 24),
        );

        if (diffDays === 0) {
          // Already active today
        } else if (diffDays === 1) {
          userProgress.streak += 1;
        } else {
          userProgress.streak = 0;
        }
        saveUserData();
      }
    } else {
      // Initialize with some demo data
      userProgress.name = "Learner";
      userProgress.avatar = "🚀";
      userProgress.completedProblems = [1, 2, 10];
      userProgress.xp = 350;
      userProgress.level = 2;
      userProgress.streak = 3;
      userProgress.badges = [1];
      userProgress.quizScores = {};
      saveUserData();
    }
  } catch (error) {
    console.error("Error loading user data, resetting to defaults:", error);
    // Reset to defaults
    userProgress = {
      name: "Learner",
      avatar: "🚀",
      completedProblems: [],
      xp: 0,
      level: 1,
      streak: 0,
      badges: [],
      lastActive: null,
      quizScores: {},
    };
    saveUserData();
  }
  // Update profile display after loading
  updateProfile();
}

// ===== QUIZ EDITOR =====
let currentProblem = null;

function openTopicModal(topic) {
  const modal = document.getElementById("topicModal");
  document.getElementById("modalTitle").textContent = topic.name;
  document.getElementById("modalTheory").textContent = topic.theory;
  document.getElementById("modalDifficulty").innerHTML =
    `<span class="difficulty-badge ${getDifficultyClass(topic.difficulty)}">${topic.difficulty}</span>`;

  const problemsList = document.getElementById("modalProblems");
  problemsList.innerHTML = topic.problems.map((p) => `<li>${p}</li>`).join("");

  document.getElementById("startPracticeBtn").onclick = () => {
    modal.classList.remove("active");
    document.getElementById("practice").scrollIntoView({ behavior: "smooth" });
  };

  modal.classList.add("active");
}

function closeTopicModal() {
  document.getElementById("topicModal").classList.remove("active");
}

let currentNotesProblemId = null;

function openNotesModal(problemId) {
  const modal = document.getElementById("notesModal");
  if (!modal) return;

  currentNotesProblemId = problemId;
  const problem = practiceProblems.find((p) => p.id === problemId);
  document.getElementById("notesModalTitle").textContent = `Notes: ${problem ? problem.title : ""}`;
  document.getElementById("notesEditor").value = userProgress.problemNotes[problemId] || "";
  modal.classList.add("active");
}

function closeNotesModal() {
  const modal = document.getElementById("notesModal");
  if (modal) {
    modal.classList.remove("active");
  }
  currentNotesProblemId = null;
}

function saveProblemNotes() {
  if (!currentNotesProblemId) return;

  const notes = document.getElementById("notesEditor").value.trim();
  userProgress.problemNotes[currentNotesProblemId] = notes;
  saveUserData();
  closeNotesModal();
  showNotification("Notes saved successfully! 📝", "success");
}

function toggleNotesButton(btn, problemId) {
  const hasNotes = btn.classList.toggle("active");
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
  saveUserData();

  // Update UI
  updateDashboard();
  updateGamification();
  initRoadmap();
  initTopicsSection();

  closeQuizEditor();
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
  };
  return (
    examples[problem.id] || "<strong>Example:</strong><br>Solve this problem"
  );
}

function generateTestCases(problem) {
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
      descHTML += "<br><br><strong>Constraints:</strong><ul>" +
        problem.constraints.map(c => `<li>${c}</li>`).join("") +
        "</ul>";
    }
    descEl.innerHTML = descHTML;
  } else {
    descEl.textContent = 'Solve the "' + problem.title + '" problem. ' +
      problem.tags.map((t) => "[" + t + "]").join(" ");
  }
  const examples = generateExamples(problem);
  document.getElementById("quizExamples").innerHTML = examples;

  const testCases = generateTestCases(problem);
  renderTestCases(testCases);

  const editor = document.getElementById("codeEditor");
  const lang = document.getElementById("languageSelect").value;
  editor.value = getDefaultCode(lang, problem);

  clearQuizOutput();

  modal.classList.add("active");

  updateLineNumbers();
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

function updateStreak() {
  const today = new Date();
  const lastActive = userProgress.lastActive
    ? new Date(userProgress.lastActive)
    : null;

  if (lastActive) {
    const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
    if (diffDays > 1) {
      userProgress.streak = 1;
    } else if (diffDays === 0) {
      // Already active today, don't increment streak
    } else {
      userProgress.streak += 1;
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
  userProgress.recentProblems =
    userProgress.recentProblems.filter(
      (id) => id !== problemId
    );

  // Add to beginning
  userProgress.recentProblems.unshift(problemId);

  // Keep only last 5
  userProgress.recentProblems =
    userProgress.recentProblems.slice(0, 5);

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
  const keywords =
    /\b(function|const|let|var|return|if|else|for|while|do|break|continue|switch|case|default|try|catch|finally|throw|new|this|class|extends|super|import|export|from|as|async|await|yield|typeof|instanceof|void|delete|in|of|with|debugger|true|false|null|undefined)\b/g;
  const strings = /(\"[^"]*\"|'[^']*'|\`[^\`]*\`)/g;
  const comments = /\/\/.*$/gm;

  let result = escapeHtml(line);

  if (comments.test(line)) {
    result = result.replace(
      comments,
      '<span class=\"token comment\">$&</span>',
    );
  }
  result = result.replace(strings, '<span class=\"token string\">$1</span>');
  result = result.replace(keywords, '<span class=\"token keyword\">$1</span>');

  const numberRegex =
    /(?<!\\.[a-zA-Z])\\b(\\d+(\\.\\d*)?|\\.\\d+)([eE][+-]?\\d+)?\\b(?!\\.[a-zA-Z])/g;
  if (!/<span class=\"token string\">/.test(result)) {
    result = result.replace(
      numberRegex,
      '<span class=\"token number\">$1</span>',
    );
  }

  return result;
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
  lineNumbers.scrollTop = editor.scrollTop;
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
    panel.classList.toggle("active");
  }
}

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

// ===== FOOTER QUESTION HANDLERS =====
// Initialize some animations after page load
window.addEventListener("load", () => {
  console.log("Algo Infinity Verse loaded successfully! 🚀");
});

// ===== NEWSLETTER FORM VALIDATION =====
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

function initNewsletterValidation() {
  const forms = [
      { formId: 'newsletterForm', inputId: 'newsletterEmail', errorId: 'newsletterError' }
  ];

  forms.forEach(({ formId, inputId, errorId }) => {
      const form = document.getElementById(formId);
      if (!form) return;

      const input = document.getElementById(inputId);
      const errorSpan = document.getElementById(errorId);

      function showError(message) {
          errorSpan.textContent = message;
          input.classList.add('input-error');
          input.classList.remove('input-success');
          input.setAttribute('aria-invalid', 'true');
      }

      function showSuccess() {
          errorSpan.textContent = '';
          input.classList.remove('input-error');
          input.classList.add('input-success');
          input.removeAttribute('aria-invalid');
      }

      function clearState() {
          errorSpan.textContent = '';
          input.classList.remove('input-error', 'input-success');
          input.removeAttribute('aria-invalid');
      }

      // Validate on blur (when user leaves the field)
      input.addEventListener('blur', () => {
          const value = input.value.trim();
          if (!value) {
              showError('Email address is required.');
          } else if (!validateEmail(value)) {
              showError('Please enter a valid email address (e.g. user@example.com).');
          } else {
              showSuccess();
          }
      });

      // Clear error while user is typing
      input.addEventListener('input', () => {
              clearState();
      });

      form.addEventListener('submit', (e) => {
          e.preventDefault();
          const value = input.value.trim();

          if (!value) {
              showError('Email address is required.');
              input.focus();
              return;
          }

          if (!validateEmail(value)) {
              showError('Please enter a valid email address (e.g. user@example.com).');
              input.focus();
              return;
          }

          // Valid — show success notification and reset
          showSuccess();
          showNotification('🎉 Successfully subscribed to the newsletter!', 'success');
          input.value = '';
          setTimeout(() => clearState(), 1500);
      });
  });
}