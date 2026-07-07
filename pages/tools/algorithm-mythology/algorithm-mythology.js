// script.js handles: loading screen, navbar, dark mode, scroll top
// This file: Algorithm Mythology Encyclopedia only
// All globals prefixed am_ or AM_ to avoid conflicts

document.addEventListener('DOMContentLoaded', function() {
  amRenderGrid(AM_LEGENDS);
  amInitFilter();
  amInitModal();
});

/* ─── Legend Data ─── */
let AM_LEGENDS = [
  {
    id: 'mergesort',
    mythName: 'Krakatoa the Unbreakable',
    realName: 'Merge Sort',
    epithet: 'Guardian of Ordered Oceans · Divider of Chaos',
    class: 'sorting',
    emoji: '🌊',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
    lore: 'In the time before order existed, when arrays were nothing but formless chaos, Krakatoa the Unbreakable descended from the mountains of recursion. His strategy was ancient and undefeatable: divide every problem in half until the parts were trivially simple, then merge the pieces back together — perfectly ordered, every time. Krakatoa never rushed. He never made mistakes. And he never, ever ran in worse than O(n log n).',
    abilities: [
      { icon: '⚔️', name: 'Divide & Conquer', desc: 'Splits any array in half with a single stroke, recursively until atomic elements remain.' },
      { icon: '🌊', name: 'Perfect Merge', desc: 'Merges two sorted halves in O(n) — every element placed in its exact rightful position.' },
      { icon: '🛡️', name: 'Stability Shield', desc: 'Equal elements maintain their original order — no chaos allowed in Krakatoa\'s kingdom.' },
      { icon: '✨', name: 'Guaranteed Power', desc: 'Best, average, and worst case all cost the same: O(n log n). Unshakeable.' },
    ],
    weaknesses: [
      'Demands O(n) extra memory — cannot sort in place like lesser gods.',
      'Slower constant factors than QuickSort on small arrays.',
      'Not the fastest in practice — but always the most reliable.',
    ],
    powers: [
      { label: 'Speed',       val: 85, color: '#06b6d4' },
      { label: 'Stability',   val: 100, color: '#22c55e' },
      { label: 'Memory Eff.',  val: 55, color: '#f59e0b' },
      { label: 'Consistency', val: 100, color: '#a855f7' },
      { label: 'Simplicity',  val: 65, color: '#ef4444' },
    ],
    complexity: ['O(n log n) all cases', 'Space: O(n)', 'Stable: ✅'],
    battles: [
      'Python\'s Timsort uses Merge Sort for large arrays.',
      'Java Collections.sort uses a Timsort variant.',
      'The Git merge algorithm is inspired by merge sort logic.',
      'External sorting of files too large for RAM.',
    ]
  },
  {
    id: 'quicksort',
    mythName: 'Stormcaller Zephyr',
    realName: 'Quick Sort',
    epithet: 'Lord of the Pivot · Rider of Average Cases',
    class: 'sorting',
    emoji: '⚡',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
    lore: 'Stormcaller Zephyr was born from lightning and instinct. Where others deliberated, Zephyr chose a pivot and struck. The battlefield would split — the weak go left, the strong go right — and Zephyr would do it again and again until all stood in perfect order. Most days, Zephyr was the fastest being alive. But on certain dark days, when the pivot was always the worst choice, Zephyr fell into the dreadful O(n²) abyss.',
    abilities: [
      { icon: '⚡', name: 'Pivot Strike', desc: 'Chooses a pivot element and partitions the array in O(n), splitting the problem.' },
      { icon: '🌀', name: 'In-Place Mastery', desc: 'Sorts without extra memory — O(log n) stack space is all Zephyr needs.' },
      { icon: '💨', name: 'Cache Fury', desc: 'Excellent cache performance due to sequential memory access patterns.' },
      { icon: '🎯', name: 'Average Dominance', desc: 'In the average case, faster than almost every sorting god in existence.' },
    ],
    weaknesses: [
      'O(n²) worst case on sorted/reverse-sorted input with bad pivot choice.',
      'Unstable — equal elements may change relative order.',
      'Performance depends heavily on pivot selection strategy.',
    ],
    powers: [
      { label: 'Speed',       val: 95, color: '#f59e0b' },
      { label: 'Stability',   val: 30, color: '#ef4444' },
      { label: 'Memory Eff.', val: 90, color: '#22c55e' },
      { label: 'Consistency', val: 60, color: '#f59e0b' },
      { label: 'Simplicity',  val: 70, color: '#06b6d4' },
    ],
    complexity: ['Avg: O(n log n)', 'Worst: O(n²)', 'Space: O(log n)'],
    battles: [
      'C++ std::sort uses an introspective sort based on QuickSort.',
      'Java Arrays.sort for primitives uses a dual-pivot QuickSort.',
      'V8 JavaScript engine (Chrome) uses Timsort/QuickSort hybrid.',
      'Linux kernel sorting routines use QuickSort variants.',
    ]
  },
  {
    id: 'bubblesort',
    mythName: 'Sisyphus the Persistent',
    realName: 'Bubble Sort',
    epithet: 'The Eternal Toiler · He Who Never Gives Up',
    class: 'sorting',
    emoji: '🪨',
    color: '#94a3b8',
    gradient: 'linear-gradient(135deg, #475569 0%, #64748b 100%)',
    lore: 'Condemned by the gods to sort forever, Sisyphus the Persistent walks the array from start to end, comparing neighbors and swapping the out-of-order. He reaches the end. The largest element is in place. He walks back and does it again. And again. In the best case, if the array is already sorted, Sisyphus takes one pass and rests. In the worst case, Sisyphus has never rested.',
    abilities: [
      { icon: '🔄', name: 'Adjacent Comparison', desc: 'Compares and swaps neighboring elements in a single pass through the array.' },
      { icon: '✨', name: 'Early Termination', desc: 'If no swaps occur in a pass, the array is sorted — O(n) best case achieved.' },
      { icon: '🛡️', name: 'Stability', desc: 'Never swaps equal elements, maintaining their original relative order.' },
      { icon: '💡', name: 'Simplicity', desc: 'The simplest sorting algorithm to understand and implement — perfect for teaching.' },
    ],
    weaknesses: [
      'O(n²) average and worst case — devastatingly slow for large arrays.',
      'Never used in production systems for performance.',
      'Every large dataset is a boulder Sisyphus cannot roll to the top.',
    ],
    powers: [
      { label: 'Speed',       val: 20, color: '#ef4444' },
      { label: 'Stability',   val: 100, color: '#22c55e' },
      { label: 'Memory Eff.', val: 100, color: '#22c55e' },
      { label: 'Consistency', val: 40, color: '#f59e0b' },
      { label: 'Simplicity',  val: 100, color: '#22c55e' },
    ],
    complexity: ['Best: O(n)', 'Worst: O(n²)', 'Space: O(1)'],
    battles: [
      'Teaching introductory algorithms courses worldwide.',
      'Sorting tiny arrays (n < 10) where simplicity wins.',
      'Detecting nearly-sorted sequences with early termination.',
    ]
  },
  {
    id: 'insertionsort',
    mythName: 'Artisan Halvard',
    realName: 'Insertion Sort',
    epithet: 'The Card Dealer · Builder of Order One by One',
    class: 'sorting',
    emoji: '🃏',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)',
    lore: 'Halvard the Artisan does not rush. He picks up one element at a time — like a card player arranging a hand — and slides it into its perfect position among the already-sorted elements to his left. The work is slow when the deck is large, but when the cards are nearly in order already, Halvard finishes in a single breath. Master of the nearly-sorted realm.',
    abilities: [
      { icon: '🃏', name: 'Card Insertion', desc: 'Takes each element and slides it into its correct position among sorted predecessors.' },
      { icon: '⚡', name: 'Nearly-Sorted Mastery', desc: 'O(n) on nearly-sorted arrays — faster than any O(n log n) algorithm in this case.' },
      { icon: '🛡️', name: 'Online Algorithm', desc: 'Can sort a stream of incoming data one element at a time, always maintaining sorted order.' },
      { icon: '✨', name: 'Cache Friendly', desc: 'Sequential memory access makes it extremely cache-efficient for small arrays.' },
    ],
    weaknesses: [
      'O(n²) for reverse-sorted input — the worst possible case.',
      'Impractical for large unsorted arrays.',
      'Outclassed by merge sort and quick sort for n > 100.',
    ],
    powers: [
      { label: 'Speed',       val: 45, color: '#f59e0b' },
      { label: 'Stability',   val: 100, color: '#22c55e' },
      { label: 'Memory Eff.', val: 100, color: '#22c55e' },
      { label: 'Consistency', val: 50, color: '#f59e0b' },
      { label: 'Simplicity',  val: 90, color: '#22c55e' },
    ],
    complexity: ['Best: O(n)', 'Worst: O(n²)', 'Space: O(1)'],
    battles: [
      'Used as the base case in Timsort (Python, Java) for small subarrays.',
      'Real-time systems where data arrives one element at a time.',
      'Nearly-sorted arrays in database refresh operations.',
    ]
  },
  {
    id: 'binarysearch',
    mythName: 'The Oracle of Halving',
    realName: 'Binary Search',
    epithet: 'Keeper of Logarithmic Truth · The Eliminator',
    class: 'search',
    emoji: '🔮',
    color: '#14b8a6',
    gradient: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
    lore: 'The Oracle of Halving speaks once and cuts the world in two. To the left: too small. To the right: too large. In the middle: perhaps the truth. The Oracle asks once per half, and with each utterance the search space collapses. Ten questions to find one truth in a thousand. Twenty questions to find one truth in a million. The Oracle does not fail on sorted terrain.',
    abilities: [
      { icon: '🔮', name: 'Halving Vision', desc: 'Eliminates half the remaining search space with each single comparison.' },
      { icon: '⚡', name: 'Logarithmic Speed', desc: 'Finds any element in O(log n) — 1 billion elements require at most 30 comparisons.' },
      { icon: '🧠', name: 'Answer Space Search', desc: 'Can binary search monotonic answer spaces — not just sorted arrays.' },
      { icon: '💎', name: 'O(1) Space', desc: 'Requires no additional memory. Pure wisdom, no equipment.' },
    ],
    weaknesses: [
      'Requires sorted input — cannot operate in chaos.',
      'Cannot find elements in unsorted arrays.',
      'Overkill for small arrays (n < 20) where linear search is simpler.',
    ],
    powers: [
      { label: 'Speed',       val: 95, color: '#14b8a6' },
      { label: 'Stability',   val: 100, color: '#22c55e' },
      { label: 'Memory Eff.', val: 100, color: '#22c55e' },
      { label: 'Consistency', val: 95, color: '#14b8a6' },
      { label: 'Simplicity',  val: 80, color: '#22c55e' },
    ],
    complexity: ['Time: O(log n)', 'Space: O(1)', 'Requires sorted input'],
    battles: [
      'Dictionary and encyclopedia lookup systems.',
      'Git bisect — finding the commit that introduced a bug.',
      'Database index range queries (B-trees use binary search).',
      'Square root and logarithm computation in math libraries.',
    ]
  },
  {
    id: 'bfs',
    mythName: 'Ripple, the Horizon Walker',
    realName: 'Breadth-First Search',
    epithet: 'Revealer of Shortest Paths · The Level-Headed',
    class: 'graph',
    emoji: '📡',
    color: '#22c55e',
    gradient: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
    lore: 'Ripple begins at a single point and sends waves outward in all directions simultaneously, like a stone dropped in still water. Every node at distance one is visited first. Then every node at distance two. Then three. When Ripple finally touches your destination, the path she took is guaranteed to be the shortest one possible. She carries a queue in her hand and never forgets where she has been.',
    abilities: [
      { icon: '🌊', name: 'Ripple Wave', desc: 'Explores all nodes at distance k before exploring any at distance k+1.' },
      { icon: '🏆', name: 'Shortest Path', desc: 'In unweighted graphs, the first time BFS reaches a node, it\'s via the shortest path.' },
      { icon: '📋', name: 'Queue Mastery', desc: 'Manages a FIFO queue to ensure nodes are processed in discovery order.' },
      { icon: '🗺️', name: 'Level Mapping', desc: 'Naturally groups nodes by their distance from the source — level order traversal.' },
    ],
    weaknesses: [
      'O(V) memory — must store the entire frontier in memory.',
      'Slow on wide graphs — the queue can hold millions of nodes.',
      'Cannot find shortest path in weighted graphs — Dijkstra\'s is needed.',
    ],
    powers: [
      { label: 'Speed',       val: 80, color: '#22c55e' },
      { label: 'Shortest Path', val: 100, color: '#22c55e' },
      { label: 'Memory Eff.', val: 55, color: '#f59e0b' },
      { label: 'Completeness', val: 100, color: '#22c55e' },
      { label: 'Simplicity',  val: 85, color: '#22c55e' },
    ],
    complexity: ['Time: O(V+E)', 'Space: O(V)', 'Unweighted shortest path: ✅'],
    battles: [
      'Google Maps and GPS shortest route finding.',
      'Social network — finding friends within 2 degrees of separation.',
      'Web crawlers exploring links level by level.',
      'Peer-to-peer network routing protocols.',
    ]
  },
  {
    id: 'dfs',
    mythName: 'Erebus the Deep Delver',
    realName: 'Depth-First Search',
    epithet: 'Seeker of Hidden Paths · The Abyss Walker',
    class: 'graph',
    emoji: '🌑',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    lore: 'Erebus does not spread. Erebus descends. When he enters a path, he follows it to the very bottom of the abyss before he returns. He carries a stack instead of a queue, and he remembers every step down so he can backtrack when the way is blocked. Erebus finds cycles, sorts topologically, and explores mazes that would overwhelm the level-headed Ripple. He is the seeker of what lies deepest.',
    abilities: [
      { icon: '🌑', name: 'Abyss Descent', desc: 'Follows each path to its terminus before backtracking — goes as deep as possible.' },
      { icon: '🔄', name: 'Cycle Detection', desc: 'Detects cycles in directed graphs by tracking nodes on the current recursion path.' },
      { icon: '📊', name: 'Topological Oracle', desc: 'Post-order DFS produces a valid topological ordering of directed acyclic graphs.' },
      { icon: '💾', name: 'Memory Thrift', desc: 'Uses O(h) memory where h is the tree height — far less than BFS on wide graphs.' },
    ],
    weaknesses: [
      'Does not guarantee the shortest path.',
      'Can get stuck in infinite loops without a visited set.',
      'May explore many useless deep paths before finding the target.',
    ],
    powers: [
      { label: 'Speed',       val: 80, color: '#a855f7' },
      { label: 'Shortest Path', val: 20, color: '#ef4444' },
      { label: 'Memory Eff.', val: 90, color: '#22c55e' },
      { label: 'Depth Mastery', val: 100, color: '#a855f7' },
      { label: 'Simplicity',  val: 85, color: '#22c55e' },
    ],
    complexity: ['Time: O(V+E)', 'Space: O(h)', 'Cycle detection: ✅'],
    battles: [
      'Topological sort for build systems and task scheduling.',
      'Maze solving and puzzle solving with backtracking.',
      'Compiler dependency resolution.',
      'Chess and game tree AI (minimax uses DFS).',
    ]
  },
  {
    id: 'dijkstra',
    mythName: 'Pathfinder Aurum',
    realName: "Dijkstra's Algorithm",
    epithet: 'Lord of Weighted Roads · Forger of Optimal Routes',
    class: 'graph',
    emoji: '🗺️',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
    lore: 'Where Ripple walks all roads equally, Aurum weighs every path by its cost. He carries a priority queue — a sacred ledger of the cheapest known routes — and always extends the least costly frontier. No road is taken unless it is provably the cheapest. When Aurum declares a path found, no shorter route exists. He is the god of weighted graphs, the master of road maps.',
    abilities: [
      { icon: '🗺️', name: 'Weighted Frontier', desc: 'Always expands the node with the smallest known distance from the source.' },
      { icon: '⚖️', name: 'Relaxation', desc: 'Updates distance estimates whenever a shorter path to a node is discovered.' },
      { icon: '📋', name: 'Priority Queue', desc: 'Uses a min-heap to efficiently select the next cheapest node in O(log V).' },
      { icon: '🏆', name: 'Optimal Guarantee', desc: 'Produces the shortest path tree from source to all reachable nodes.' },
    ],
    weaknesses: [
      'Fails on graphs with negative edge weights — Bellman-Ford is needed there.',
      'O((V+E) log V) — slower than BFS for unweighted graphs.',
      'Does not handle negative cycles at all.',
    ],
    powers: [
      { label: 'Speed',           val: 80, color: '#f97316' },
      { label: 'Weighted Paths',  val: 100, color: '#22c55e' },
      { label: 'Memory Eff.',     val: 70, color: '#f59e0b' },
      { label: 'Optimality',      val: 100, color: '#22c55e' },
      { label: 'Simplicity',      val: 65, color: '#f59e0b' },
    ],
    complexity: ['Time: O((V+E) log V)', 'Space: O(V)', 'No negative weights'],
    battles: [
      'Google Maps turn-by-turn navigation.',
      'Network routing protocols (OSPF uses Dijkstra\'s).',
      'Flight and train route optimization.',
      'Video game pathfinding (A* extends Dijkstra\'s with heuristics).',
    ]
  },
  {
    id: 'hashmap',
    mythName: 'Hermes the Key-Bearer',
    realName: 'HashMap',
    epithet: 'God of Instant Recall · Master of All Keys',
    class: 'search',
    emoji: '🗝️',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
    lore: 'Hermes the Key-Bearer holds a key to every door in the universe, and he knows where every door leads. Give him a key, and he will return the treasure in O(1) — no searching, no traversal, just pure recall. He built his palace in scattered buckets across a vast kingdom, and his hash function sends every key to exactly the right bucket. Only when too many keys collide in one bucket does Hermes slow.',
    abilities: [
      { icon: '🗝️', name: 'Instant Recall', desc: 'Retrieves any value in O(1) average time by hashing the key to its bucket.' },
      { icon: '🏗️', name: 'O(1) Insert', desc: 'Adds new key-value pairs in constant time on average.' },
      { icon: '⚡', name: 'O(1) Delete', desc: 'Removes entries in O(1) — no shifting, no searching.' },
      { icon: '🔄', name: 'Collision Resolution', desc: 'Handles bucket collisions via chaining or open addressing.' },
    ],
    weaknesses: [
      'O(n) worst case when all keys hash to the same bucket.',
      'No inherent ordering — cannot retrieve elements in sorted order.',
      'Hash function quality determines everything.',
    ],
    powers: [
      { label: 'Speed',       val: 97, color: '#ef4444' },
      { label: 'Ordering',    val: 0,  color: '#64748b' },
      { label: 'Memory Eff.', val: 65, color: '#f59e0b' },
      { label: 'Consistency', val: 75, color: '#f59e0b' },
      { label: 'Simplicity',  val: 85, color: '#22c55e' },
    ],
    complexity: ['Avg: O(1)', 'Worst: O(n)', 'Space: O(n)'],
    battles: [
      'Compiler symbol tables for variable lookup.',
      'Database indexing (hash index type).',
      'Caching systems — the heart of every LRU cache.',
      'DNS resolution — mapping domain names to IPs.',
    ]
  },
  {
    id: 'heap',
    mythName: 'Kronos the Priority Titan',
    realName: 'Heap (Priority Queue)',
    epithet: 'Lord of All Priorities · He Who Knows What Matters',
    class: 'structure',
    emoji: '👑',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
    lore: 'Kronos the Priority Titan watches everything. He sees all priorities. He knows, always, who deserves to go first. His palace is a complete binary tree stored as an array, and every parent outranks every child. When a new being arrives in his kingdom, it may briefly sit above its station — but Kronos sifts it upward or downward until the hierarchy is restored. Ask him who is most important, and the answer comes instantly.',
    abilities: [
      { icon: '👑', name: 'O(1) Peek', desc: 'The highest priority element always sits at the root — accessible in O(1).' },
      { icon: '⬆️', name: 'Sift Up', desc: 'After insertion at the bottom, the new element rises until the heap property is restored.' },
      { icon: '⬇️', name: 'Sift Down', desc: 'After extraction, the last element fills the root and sifts down to its correct position.' },
      { icon: '🏗️', name: 'O(n) Build', desc: 'Can transform any array into a valid heap in O(n) — not O(n log n) as one might expect.' },
    ],
    weaknesses: [
      'O(n) to search for an arbitrary element — no shortcut exists.',
      'Not stable — equal elements may appear in any order.',
      'Random access to middle elements is O(n).',
    ],
    powers: [
      { label: 'Speed',       val: 85, color: '#f59e0b' },
      { label: 'Priority Ops', val: 100, color: '#22c55e' },
      { label: 'Memory Eff.', val: 90, color: '#22c55e' },
      { label: 'Consistency', val: 90, color: '#22c55e' },
      { label: 'Simplicity',  val: 70, color: '#f59e0b' },
    ],
    complexity: ['Peek: O(1)', 'Push/Pop: O(log n)', 'Build: O(n)'],
    battles: [
      'Operating system process scheduling.',
      "Dijkstra's and Prim's algorithms rely on heap-based priority queues.",
      'Hospital triage systems (highest severity first).',
      'Huffman encoding tree construction.',
    ]
  },
  {
    id: 'dp',
    mythName: 'Mnemosyne the Memory Goddess',
    realName: 'Dynamic Programming',
    epithet: 'Goddess of Perfect Memory · Solver of Overlapping Truths',
    class: 'search',
    emoji: '🧠',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
    lore: 'Mnemosyne, goddess of memory, never solves the same problem twice. When a subproblem is conquered, its answer is carved into her eternal tablet. When the same challenge returns — and it always does — Mnemosyne retrieves the answer instantly. She sees patterns within patterns, substructures within structures. Her solutions are always optimal, always provable, and always built bottom-up from the simplest truth.',
    abilities: [
      { icon: '🧠', name: 'Perfect Memoization', desc: 'Every solved subproblem is stored. No computation is ever repeated.' },
      { icon: '📊', name: 'Optimal Substructure', desc: 'Identifies that the optimal solution to a problem contains optimal solutions to subproblems.' },
      { icon: '🔄', name: 'Overlapping Subproblems', desc: 'Recognizes when the same subproblems recur and exploits them.' },
      { icon: '🏆', name: 'Provable Optimality', desc: 'The result is mathematically proven optimal — not heuristic, not approximate.' },
    ],
    weaknesses: [
      'High memory usage — the tablet of mnemosyne grows with every subproblem.',
      'Slow to start — must identify subproblems and their relationships first.',
      'Not all problems have optimal substructure — Mnemosyne cannot help everyone.',
    ],
    powers: [
      { label: 'Optimality',  val: 100, color: '#3b82f6' },
      { label: 'Speed',       val: 75,  color: '#06b6d4' },
      { label: 'Memory Eff.', val: 45,  color: '#ef4444' },
      { label: 'Versatility', val: 90,  color: '#22c55e' },
      { label: 'Simplicity',  val: 35,  color: '#ef4444' },
    ],
    complexity: ['Varies by problem', 'Often O(n²) or O(n)', 'Space: O(n) to O(n²)'],
    battles: [
      'Google Maps route optimization (shortest path DP).',
      'Bioinformatics — DNA sequence alignment (Smith-Waterman).',
      'Natural language processing — CYK parsing algorithm.',
      'Financial modeling — optimal portfolio allocation.',
    ]
  },
  {
    id: 'unionfind',
    mythName: 'Yggdrasil the Tree Binder',
    realName: 'Union-Find (DSU)',
    epithet: 'Keeper of Connected Realms · The Root Finder',
    class: 'graph',
    emoji: '🌳',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    lore: 'Yggdrasil, the World Tree, binds all realms. He knows which lands are connected and which remain separate kingdoms. Ask him if two heroes are allies — he answers in nearly O(1). Command him to unite two kingdoms — he binds them instantly, making one tree serve as the root of both. His path compression magic flattens his branches so future queries cost almost nothing. He is the god of connected components.',
    abilities: [
      { icon: '🌳', name: 'Union by Rank', desc: 'Merges two sets by attaching the shorter tree under the taller — keeps trees flat.' },
      { icon: '✨', name: 'Path Compression', desc: 'Makes every node on a Find path point directly to the root — O(α(n)) amortized.' },
      { icon: '⚡', name: 'Near O(1) Operations', desc: 'With both optimizations, operations run in O(α(n)) — effectively constant time.' },
      { icon: '🔗', name: 'Component Tracking', desc: 'Instantly answers if two elements belong to the same connected component.' },
    ],
    weaknesses: [
      'Cannot efficiently delete a single element from a set.',
      'Does not store the actual path — only whether two nodes are connected.',
      'Without optimizations, degrades to O(n) per operation.',
    ],
    powers: [
      { label: 'Speed',       val: 98, color: '#10b981' },
      { label: 'Memory Eff.', val: 95, color: '#22c55e' },
      { label: 'Connectivity', val: 100, color: '#22c55e' },
      { label: 'Simplicity',  val: 80, color: '#22c55e' },
      { label: 'Versatility', val: 70, color: '#f59e0b' },
    ],
    complexity: ['O(α(n)) amortized', 'Space: O(n)', 'α(n) ≈ O(1) practical'],
    battles: [
      'Kruskal\'s MST algorithm relies entirely on Union-Find.',
      'Network connectivity problems in distributed systems.',
      'Image segmentation — grouping connected pixels.',
      'Percolation theory in physics simulations.',
    ]
  },
];

/* ─── Helpers ─── */
function amEscape(str) {
  let d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* ─── Render Grid ─── */
function amRenderGrid(legends) {
  let grid  = document.getElementById('amGrid');
  let empty = document.getElementById('amEmpty');
  if (!grid) return;

  if (legends.length === 0) {
    grid.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    return;
  }

  if (empty) empty.classList.add('hidden');

  grid.innerHTML = legends.map(function(leg) {
    let chips = leg.complexity.map(function(c) {
      return '<span class="am-power-chip">' + amEscape(c) + '</span>';
    }).join('');

    let abilityBadges = leg.abilities.slice(0, 3).map(function(a) {
      return '<span class="am-ability-badge">' + amEscape(a.name) + '</span>';
    }).join('');

    let classLabel = {
      sorting:   '⚔️ Sorting God',
      search:    '🔍 Oracle Seeker',
      graph:     '🌐 Graph Walker',
      structure: '🏛️ Structure Keeper'
    }[leg.class] || '';

    return '<div class="am-card" tabindex="0" role="button" data-id="' + leg.id + '" ' +
           'aria-label="Open ' + amEscape(leg.realName) + ' legend">' +
      '<div class="am-card-banner" style="background:' + leg.gradient + '">' +
        '<div class="am-card-banner-pattern"></div>' +
        '<span class="am-card-banner-emoji">' + leg.emoji + '</span>' +
        '<span class="am-card-class">' + classLabel + '</span>' +
      '</div>' +
      '<div class="am-card-body">' +
        '<div class="am-card-myth-name" style="color:' + leg.color + '">' + amEscape(leg.mythName) + '</div>' +
        '<div class="am-card-real-name">' + amEscape(leg.realName) + '</div>' +
        '<div class="am-card-epithet">' + amEscape(leg.epithet) + '</div>' +
        '<div class="am-card-powers">' + chips + '</div>' +
        '<div class="am-card-abilities">' + abilityBadges + '</div>' +
        '<div class="am-card-cta"><i class="fas fa-book-open"></i> Read the Lore</div>' +
      '</div>' +
    '</div>';
  }).join('');

  grid.querySelectorAll('.am-card').forEach(function(card) {
    let open = function() {
      let id = card.getAttribute('data-id');
      amOpenModal(id);
    };
    card.addEventListener('click', open);
    card.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });
}

/* ─── Modal ─── */
function amInitModal() {
  let modal    = document.getElementById('amModal');
  let closeBtn = document.getElementById('amModalClose');
  if (!modal || !closeBtn) return;

  closeBtn.addEventListener('click', function() { modal.classList.remove('active'); });
  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.classList.remove('active');
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') modal.classList.remove('active');
  });
}

function amOpenModal(id) {
  let leg = null;
  for (let i = 0; i < AM_LEGENDS.length; i++) {
    if (AM_LEGENDS[i].id === id) { leg = AM_LEGENDS[i]; break; }
  }
  if (!leg) return;

  let modal = document.getElementById('amModal');
  let body  = document.getElementById('amModalBody');
  if (!modal || !body) return;

  // Build abilities grid
  let abilitiesHtml = leg.abilities.map(function(a) {
    return '<div class="am-ability-card">' +
      '<div class="am-ability-name">' + a.icon + ' ' + amEscape(a.name) + '</div>' +
      '<div class="am-ability-desc">' + amEscape(a.desc) + '</div>' +
    '</div>';
  }).join('');

  // Build weaknesses
  let weakHtml = leg.weaknesses.map(function(w) {
    return '<div class="am-weakness-item">' + amEscape(w) + '</div>';
  }).join('');

  // Build power levels
  let powerHtml = leg.powers.map(function(p) {
    return '<div class="am-power-row">' +
      '<span class="am-power-label">' + amEscape(p.label) + '</span>' +
      '<div class="am-power-bar-track">' +
        '<div class="am-power-bar-fill" style="width:0%;background:' + p.color + '" data-pct="' + p.val + '"></div>' +
      '</div>' +
      '<span class="am-power-val">' + p.val + '/100</span>' +
    '</div>';
  }).join('');

  // Battles
  let battlesHtml = leg.battles.map(function(b) {
    return '<div class="am-battle-item">' + amEscape(b) + '</div>';
  }).join('');

  let classLabel = {
    sorting:   '⚔️ Sorting God',
    search:    '🔍 Oracle Seeker',
    graph:     '🌐 Graph Walker',
    structure: '🏛️ Structure Keeper'
  }[leg.class] || '';

  body.innerHTML =
    '<div class="am-modal-banner" style="background:' + leg.gradient + '">' +
      '<div class="am-card-banner-pattern"></div>' +
      '<span class="am-modal-banner-emoji">' + leg.emoji + '</span>' +
    '</div>' +
    '<div class="am-modal-inner">' +
      '<div class="am-modal-myth-name" style="color:' + leg.color + '">' + amEscape(leg.mythName) + ' · ' + classLabel + '</div>' +
      '<div class="am-modal-real-name">' + amEscape(leg.realName) + '</div>' +
      '<div class="am-modal-epithet">' + amEscape(leg.epithet) + '</div>' +

      '<div class="am-modal-section">' +
        '<div class="am-modal-section-title"><i class="fas fa-scroll"></i> Ancient Lore</div>' +
        '<div class="am-modal-lore">' + amEscape(leg.lore) + '</div>' +
      '</div>' +

      '<div class="am-modal-section">' +
        '<div class="am-modal-section-title"><i class="fas fa-bolt"></i> Sacred Abilities</div>' +
        '<div class="am-abilities-grid">' + abilitiesHtml + '</div>' +
      '</div>' +

      '<div class="am-modal-section">' +
        '<div class="am-modal-section-title"><i class="fas fa-skull"></i> Known Weaknesses</div>' +
        '<div class="am-weaknesses">' + weakHtml + '</div>' +
      '</div>' +

      '<div class="am-modal-section">' +
        '<div class="am-modal-section-title"><i class="fas fa-chart-bar"></i> Power Levels</div>' +
        '<div class="am-power-levels">' + powerHtml + '</div>' +
      '</div>' +

      '<div class="am-modal-section">' +
        '<div class="am-modal-section-title"><i class="fas fa-sword"></i> Ancient Battles Won</div>' +
        '<div class="am-battles">' + battlesHtml + '</div>' +
      '</div>' +
    '</div>';

  modal.classList.add('active');

  // Animate power bars after render
  requestAnimationFrame(function() {
    setTimeout(function() {
      body.querySelectorAll('.am-power-bar-fill').forEach(function(bar) {
        bar.style.width     = bar.getAttribute('data-pct') + '%';
        bar.style.transition = 'width 1s ease';
      });
    }, 80);
  });
}

/* ─── Filter & Search ─── */
function amInitFilter() {
  let filterBtns = document.querySelectorAll('.am-filter-btn');
  let searchEl   = document.getElementById('amSearch');

  let activeClass = 'all';
  let searchQuery = '';

  function applyFilter() {
    let filtered = AM_LEGENDS.filter(function(leg) {
      let matchClass  = activeClass === 'all' || leg.class === activeClass;
      let matchSearch = !searchQuery ||
        leg.realName.toLowerCase().indexOf(searchQuery) !== -1 ||
        leg.mythName.toLowerCase().indexOf(searchQuery) !== -1 ||
        leg.epithet.toLowerCase().indexOf(searchQuery) !== -1;
      return matchClass && matchSearch;
    });
    amRenderGrid(filtered);
  }

  filterBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      filterBtns.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      activeClass = btn.getAttribute('data-class');
      applyFilter();
    });
  });

  if (searchEl) {
    searchEl.addEventListener('input', function() {
      searchQuery = searchEl.value.toLowerCase().trim();
      applyFilter();
    });
  }
}