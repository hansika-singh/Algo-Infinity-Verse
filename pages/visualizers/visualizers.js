/* ============================================
   VISUALIZERS — Data, Search & Filter
   ============================================ */

const visualizers = [
  {
    name: 'Distributed Tracing Simulator',
    path: '/pages/visualizers/distributed-tracing/distributed-tracing.html',
    category: 'Distributed Systems',
    icon: 'fa-project-diagram',
    desc: 'Simulate Jaeger/OpenTelemetry span propagation across microservices.',
  },
  {
    name: 'OAuth 2.0 PKCE Sandbox',
    path: '/pages/visualizers/oauth-pkce-sandbox/oauth-pkce-sandbox.html',
    category: 'Security & Crypto',
    icon: 'fa-lock',
    desc: 'Interactive sandbox for the OAuth 2.0 Authorization Code Flow with PKCE.',
  },
  {
    name: 'CQRS & Event Sourcing',
    path: '/pages/visualizers/cqrs-visualizer/cqrs-visualizer.html',
    category: 'Distributed Systems',
    icon: 'fa-database',
    desc: 'Interactive simulator for Command Query Responsibility Segregation and Event Sourcing.',
  },
  // ── Sorting & Searching ──
  {
    name: 'Sorting Visualizer',
    path: '/pages/visualizers/sorting-visualizer/sorting-visualizer.html',
    category: 'Sorting & Searching',
    icon: 'fa-chart-bar',
    desc: 'Watch bubble, selection, insertion, merge, and quick sort algorithms animate step by step.',
  },
  {
    name: 'Sorting Visualizer (Pro)',
    path: '/pages/sort/sorting-visualizer.html',
    category: 'Sorting & Searching',
    icon: 'fa-chart-line',
    desc: 'Advanced sorting visualizer with custom data sets and performance metrics.',
  },
  {
    name: 'Rabin-Karp Visualizer',
    path: '/pages/visualizers/rabin-karp-visualizer/rabin-karp-visualizer.html',
    category: 'Sorting & Searching',
    icon: 'fa-search',
    desc: 'Visualize the Rabin-Karp string matching algorithm using rolling hash.',
  },
  {
    name: 'String Matching Visualizer',
    path: '/pages/visualizers/string-matching-visualizer/string-matching-visualizer.html',
    category: 'Sorting & Searching',
    icon: 'fa-font',
    desc: 'Compare different string matching algorithms side by side.',
  },
  {
    name: 'KMP Prefix Function Visualizer',
    path: '/pages/visualizers/prefix-function-kmp-visualizer/kmp-visualizer.html',
    category: 'Sorting & Searching',
    icon: 'fa-link',
    desc: 'Step through the Knuth-Morris-Pratt algorithm and its prefix function.',
  },
  {
    name: 'Suffix Array Visualizer',
    path: '/pages/visualizers/suffix-array-visualizer/suffix-array-visualizer.html',
    category: 'Sorting & Searching',
    icon: 'fa-list',
    desc: 'Build and explore suffix arrays for string processing.',
  },
  {
    name: 'Big-O Analyzer',
    path: '/pages/visualizers/big-o-analyzer/big-o-analyzer.html',
    category: 'Sorting & Searching',
    icon: 'fa-stopwatch',
    desc: 'Visualize time complexity growth rates across different algorithms.',
  },
  {
    name: 'Algorithmic Complexity Sandbox',
    path: '/pages/visualizers/complexity-analyzer/index.html',
    category: 'Sorting & Searching',
    icon: 'fa-gauge-high',
    desc: 'Profile and compare execution runtimes and memory curves for two custom solutions side by side.',
  },
  {
    name: 'Binary Search Visualizer',
    path: '/pages/learning/binary-search/binary-search.html',
    category: 'Sorting & Searching',
    icon: 'fa-crosshairs',
    desc: 'Interactive binary search with divide-and-conquer visualization.',
  },
  {
    name: 'Binary Search Boundary Finder',
    path: '/pages/visualizers/binary-search-boundaries/binary-search-boundaries.html',
    category: 'Sorting & Searching',
    icon: 'fa-arrows-to-dot',
    desc: 'Compare leftmost, rightmost, and insert-position binary search side-by-side with lo/hi/mid and mid±1 rules.',
  },
  {
    name: 'Fast/Slow Pointer Simulator',
    path: '/pages/visualizers/fast-slow-pointer-simulator/fast-slow-pointer-simulator.html',
    category: 'Sorting & Searching',
    icon: 'fa-arrows-left-right',
    desc: "Visualize Floyd's cycle detection algorithm with fast and slow pointers.",
  },
  {
    name: 'Sliding Window Invariant Lab',
    path: '/pages/visualizers/sliding-window-lab/sliding-window-lab.html',
    category: 'Sorting & Searching',
    icon: 'fa-window-maximize',
    desc: 'Expand/shrink a sliding window live, track sum/count invariants, and learn why each move happens.',
  },

  // ── Trees & BSTs ──
  {
    name: 'Tree Visualizer',
    path: '/pages/visualizers/tree-visualizer/tree-visualizer.html',
    category: 'Trees & BSTs',
    icon: 'fa-tree',
    desc: 'Build, modify, and traverse binary search trees with animated DFS/BFS.',
  },
  {
    name: 'Tree Traversals',
    path: '/pages/visualizers/tree-traversal/tree-traversal.html',
    category: 'Trees & BSTs',
    icon: 'fa-arrows-rotate',
    desc: 'Master inorder, preorder, postorder, and level-order tree traversals.',
  },
  {
    name: 'Self-Balancing Trees',
    path: '/pages/visualizers/self-balancing-trees/self-balancing-trees.html',
    category: 'Trees & BSTs',
    icon: 'fa-scale-balanced',
    desc: 'Visualize AVL and Red-Black tree rotations and rebalancing.',
  },
  {
    name: 'Red-Black Tree Visualizer',
    path: '/pages/visualizers/virbt-visualizer/rbt-visualizer.html',
    category: 'Trees & BSTs',
    icon: 'fa-circle',
    desc: 'Step through Red-Black tree insertions, deletions, and color flips.',
  },
  {
    name: 'B+ Tree Visualizer',
    path: '/pages/visualizers/bplus-tree-visualizer/bplus-tree-visualizer.html',
    category: 'Trees & BSTs',
    icon: 'fa-code-branch',
    desc: 'Explore B+ tree structure with split and merge operations.',
  },
  {
    name: 'B-Tree Visualizer',
    path: '/pages/visualizers/b-tree-visualizer/b-tree-visualizer.html',
    category: 'Trees & BSTs',
    icon: 'fa-seedling',
    desc: 'Interactive B-tree with degree-based split and merge animations.',
  },
  {
    name: 'KD-Tree Visualizer',
    path: '/pages/visualizers/kd-tree-visualizer/kd-tree-visualizer.html',
    category: 'Trees & BSTs',
    icon: 'fa-ruler-combined',
    desc: 'Build and query k-dimensional trees for spatial partitioning.',
  },
  {
    name: 'Trie Visualizer',
    path: '/pages/visualizers/trie-visualizer/trie-visualizer.html',
    category: 'Trees & BSTs',
    icon: 'fa-language',
    desc: 'Visualize prefix tree operations: insert, search, and delete words.',
  },
  {
    name: 'Segment Tree Simulator',
    path: '/pages/visualizers/segment-tree-simulator/segment-tree-simulator.html',
    category: 'Trees & BSTs',
    icon: 'fa-chart-simple',
    desc: 'Build and query segment trees for range sum, min, and max.',
  },
  {
    name: 'Persistent Segment Tree',
    path: '/pages/visualizers/persistent-segtree/persistent-segtree.html',
    category: 'Trees & BSTs',
    icon: 'fa-floppy-disk',
    desc: 'Explore persistent data structures with versioned segment trees.',
  },
  {
    name: 'Heap Percolation Visualizer',
    path: '/pages/visualizers/heap-percolation-visualizer/heap-percolation-visualizer.html',
    category: 'Trees & BSTs',
    icon: 'fa-chart-line',
    desc: 'Watch heapify, percolate up, and percolate down in action.',
  },
  {
    name: '3D Heap Visualizer',
    path: '/pages/visualizers/heap-3d-visualizer/heap-3d-visualizer.html',
    category: 'Trees & BSTs',
    icon: 'fa-cube',
    desc: 'A 3D visualization of binary heap structure and operations.',
  },
  {
    name: 'LSM Tree Visualizer',
    path: '/pages/visualizers/lsm-tree/lsm-tree.html',
    category: 'Trees & BSTs',
    icon: 'fa-database',
    desc: 'Understand Log-Structured Merge Tree architecture and compaction.',
  },
  {
    name: 'Binomial Heap Visualizer',
    path: '/pages/visualizers/binomial-heap/binomial-heap.html',
    category: 'Trees & BSTs',
    icon: 'fa-book',
    desc: 'Visualize binomial heap merge and extract-min operations.',
  },
  {
    name: 'Interval Tree Visualizer',
    path: '/pages/visualizers/interval-tree/interval-tree.html',
    category: 'Data Structures',
    icon: 'fa-ruler-horizontal',
    desc: 'Augmented BST storing intervals — max-endpoint pruning, overlap queries, and calendar conflict detection in O(log n + k).',
  },
  {
    name: "Suffix Tree Visualizer (Ukkonen's)",
    path: '/pages/visualizers/suffix-tree-visualizer/suffix-tree-visualizer.html',
    category: 'Special',
    icon: 'fa-sitemap',
    desc: 'Online O(n) suffix tree construction — active point, extension rules, and suffix links.',
  },

  // ── Graph Algorithms ──
  {
    name: 'Graph Visualizer',
    path: '/pages/visualizers/graph-visualizer/graph-visualizer.html',
    category: 'Graph Algorithms',
    icon: 'fa-project-diagram',
    desc: 'Build graphs interactively and run BFS, DFS, and shortest path algorithms.',
  },
  {
    name: 'Graph Visualizer (Pro)',
    path: '/pages/graph/graph-visualizer.html',
    category: 'Graph Algorithms',
    icon: 'fa-globe',
    desc: 'Advanced graph editor with weighted edges and multiple algorithm support.',
  },
  {
    name: 'Topological Sort Visualizer',
    path: '/pages/visualizers/topological-sort-visualizer/topological-sort-visualizer.html',
    category: 'Graph Algorithms',
    icon: 'fa-list',
    desc: "Visualize Kahn's algorithm and DFS-based topological ordering.",
  },
  {
    name: 'Min-Cost Max-Flow Visualizer',
    path: '/pages/visualizers/min-cost-max-flow-visualizer/min-cost-max-flow-visualizer.html',
    category: 'Graph Algorithms',
    icon: 'fa-coins',
    desc: 'Optimize flow networks with minimum cost maximum flow algorithms.',
  },
  {
    name: 'Ford-Fulkerson Visualizer',
    path: '/pages/visualizers/ford-fulkerson-visualizer/ford-fulkerson-visualizer.html',
    category: 'Graph Algorithms',
    icon: 'fa-water',
    desc: 'Visualize the Ford-Fulkerson method for computing maximum flow.',
  },
  {
    name: 'Hopcroft-Karp Visualizer',
    path: '/pages/visualizers/hopcroft-karp-visualizer/hopcroft-karp-visualizer.html',
    category: 'Graph Algorithms',
    icon: 'fa-person-running',
    desc: 'Maximum bipartite matching visualized with augmenting paths.',
  },
  {
    name: 'Bellman-Ford & SPFA',
    path: '/pages/visualizers/bellman-ford-visualizer/bellman-ford-visualizer.html',
    category: 'Graph Algorithms',
    icon: 'fa-bell',
    desc: 'Shortest path with negative weights — Bellman-Ford and SPFA algorithms.',
  },
  {
    name: 'Network Routing Simulator',
    path: '/pages/visualizers/network-routing-simulator/network-routing-simulator.html',
    category: 'Graph Algorithms',
    icon: 'fa-wifi',
    desc: 'Simulate routing protocols and visualize network topology.',
  },
  {
    name: 'Graph Algorithm Race',
    path: '/pages/visualizers/graph-algorithm-race/graph-algorithm-race.html',
    category: 'Graph Algorithms',
    icon: 'fa-flag-checkered',
    desc: 'Compare graph algorithm performance side by side in real time.',
  },
  {
    name: 'Pathfinding Visualizer',
    path: '/pages/visualizers/pathfinding-visualizer/pathfinding-visualizer.html',
    category: 'Graph Algorithms',
    icon: 'fa-map',
    desc: 'Visualize A*, Dijkstra, BFS, and DFS pathfinding on a grid.',
  },
  {
    name: 'Pathfinding Arena',
    path: '/pages/visualizers/pathfinding-arena/pathfinding-arena.html',
    category: 'Graph Algorithms',
    icon: 'fa-crosshairs',
    desc: 'Pit pathfinding algorithms against each other in an arena.',
  },
  {
    name: '3D Pathfinding',
    path: '/pages/visualizers/3d-pathfinding/3d-pathfinding.html',
    category: 'Graph Algorithms',
    icon: 'fa-cube',
    desc: 'Pathfinding in 3D space with volumetric obstacles.',
  },
  {
    name: 'Pathfinding Under Fire',
    path: '/pages/visualizers/pathfinding-under-fire/pathfinding-under-fire.html',
    category: 'Graph Algorithms',
    icon: 'fa-bolt',
    desc: 'Dynamic pathfinding with obstacles moving in real time.',
  },
  {
    name: 'Union-Find Visualizer',
    path: '/pages/visualizers/union-find-visualizer/union-find-visualizer.html',
    category: 'Graph Algorithms',
    icon: 'fa-link',
    desc: 'Visualize Disjoint Set Union with path compression and union by rank.',
  },
  {
    name: 'Graph Coloring Visualizer',
    path: '/pages/visualizers/graph-coloring-visualizer/graph-coloring-visualizer.html',
    category: 'Graph Algorithms',
    icon: 'fa-palette',
    desc: 'Greedy vs backtracking coloring — exam scheduling, register allocation, and map coloring.',
  },
  {
    name: 'Boyer-Moore Voting Visualizer',
    path: '/pages/visualizers/boyer-moore-voting/boyer-moore-voting.html',
    category: 'Algorithms',
    icon: 'fa-vote-yea',
    desc: 'Find the majority element in one pass with O(1) space — step through candidate replacement, verification, and the n/3 extension.',
  },
  {
    name: 'Circuit Breaker Visualizer',
    path: '/pages/visualizers/circuit-breaker/circuit-breaker.html',
    category: 'System Design',
    icon: 'fa-bolt',
    desc: 'Netflix resilience pattern — watch CLOSED, OPEN, HALF-OPEN state transitions, cooldown timers, and see wasted cost without a breaker.',
  },
  {
    name: 'Bully Algorithm Visualizer',
    path: '/pages/visualizers/bully-algorithm-visualizer/bully-algorithm-visualizer.html',
    category: 'Distributed Systems',
    icon: 'fa-crown',
    desc: 'Leader election where the highest surviving ID always wins — concurrent failures, network partitions, and split-brain.',
  },
  {
    name: 'Quorum Replication Visualizer',
    path: '/pages/visualizers/quorum-replication/quorum-replication.html',
    category: 'System Design',
    icon: 'fa-circle-nodes',
    desc: 'Dynamo-style N/W/R tunable consistency — animated write/read quorums, staleness demo, read repair, and strong consistency guarantee.',
  },

  // ── Dynamic Programming ──
  {
    name: 'DP Visualizer',
    path: '/pages/visualizers/dp-visualizer/dp-visualizer.html',
    category: 'Dynamic Programming',
    icon: 'fa-bullseye',
    desc: 'Visualize DP table filling for classic problems like knapsack and LCS.',
  },
  {
    name: '3D DP Visualizer',
    path: '/pages/visualizers/3d-dp-visualizer/3d-dp-visualizer.html',
    category: 'Dynamic Programming',
    icon: 'fa-cube',
    desc: 'Three-dimensional DP with interactive table visualization.',
  },
  {
    name: 'Edit Distance Visualizer',
    path: '/pages/visualizers/edit-distance/edit-distance.html',
    category: 'Dynamic Programming',
    icon: 'fa-scissors',
    desc: 'Step through the Levenshtein distance DP table cell by cell.',
  },
  {
    name: 'Monotonic Deque Visualizer',
    path: '/pages/visualizers/monotonic-deque/monotonic-deque.html',
    category: 'Dynamic Programming',
    icon: 'fa-layer-group',
    desc: 'Visualize sliding window maximum using monotonic deque.',
  },
  {
    name: 'Recursion Tree Visualizer',
    path: '/pages/visualizers/recursion-tree-visualizer/recursion-tree-visualizer.html',
    category: 'Dynamic Programming',
    icon: 'fa-seedling',
    desc: 'See recursion trees grow as Fibonacci and other DP problems compute.',
  },

  // ── Systems & OS ──
  {
    name: 'Memory Palace — RAM Simulator',
    path: '/pages/visualizers/memory-palace/memory-palace.html',
    category: 'Systems & OS',
    icon: 'fa-landmark',
    desc: 'Visualize RAM allocation, paging, and memory addressing.',
  },
  {
    name: 'MESI Simulator',
    path: '/pages/visualizers/mesi-simulator/mesi-simulator.html',
    category: 'Systems & OS',
    icon: 'fa-arrows-rotate',
    desc: 'Cache coherence protocol simulation with MESI states.',
  },
  {
    name: 'OS Paging Simulator',
    path: '/pages/visualizers/os-paging/os-paging.html',
    category: 'Systems & OS',
    icon: 'fa-file',
    desc: 'Visualize page tables, TLB, and virtual-to-physical address translation.',
  },
  {
    name: 'Cache Replacement Arena',
    path: '/pages/visualizers/cache-replacement-arena/cache-replacement-arena.html',
    category: 'Systems & OS',
    icon: 'fa-bolt',
    desc: 'Compare LRU, LFU, FIFO, and other cache replacement policies.',
  },
  {
    name: 'GC Visualizer',
    path: '/pages/visualizers/gc-visualizer/gc-visualizer.html',
    category: 'Systems & OS',
    icon: 'fa-trash-can',
    desc: 'Visualize garbage collection algorithms: mark-sweep, copy, and compact.',
  },
  {
    name: 'Garbage Collector Simulator',
    path: '/pages/visualizers/gc-simulator/gc-simulator.html',
    category: 'Systems & OS',
    icon: 'fa-broom',
    desc: 'Interactive GC simulator with generational collection strategies.',
  },
  {
    name: 'QUIC & HTTP/3 Simulator',
    path: '/pages/visualizers/quic-simulator/quic-simulator.html',
    category: 'Systems & OS',
    icon: 'fa-network-wired',
    desc: "Interactive simulator comparing TCP/TLS handshakes against QUIC's 0-RTT.",
  },
  {
    name: 'Kubernetes Pod Scheduler',
    path: '/pages/visualizers/kube-scheduler/kube-scheduler.html',
    category: 'Systems & OS',
    icon: 'fa-dharmachakra',
    desc: 'Visualize Kube-Scheduler filtering, scoring, and bin-packing algorithms.',
  },
  {
    name: 'V8 GC Visualizer',
    path: '/pages/visualizers/v8-gc/v8-gc.html',
    category: 'Systems & OS',
    icon: 'fa-gear',
    desc: "Visualize V8 JavaScript engine's garbage collection phases.",
  },
  {
    name: 'Malloc Visualizer',
    path: '/pages/visualizer/malloc-visualizer/malloc-visualizer.html',
    category: 'Systems & OS',
    icon: 'fa-puzzle-piece',
    desc: 'Visualize dynamic memory allocation with malloc and free.',
  },
  {
    name: 'SSD Simulator',
    path: '/pages/visualizers/ssd-simulator/ssd-simulator.html',
    category: 'Systems & OS',
    icon: 'fa-hard-drive',
    desc: 'Simulate SSD wear leveling, garbage collection, and FTL mapping.',
  },
  {
    name: 'Branch Predictor Simulator',
    path: '/pages/visualizers/branch-predictor-simulator/branch-predictor-simulator.html',
    category: 'Systems & OS',
    icon: 'fa-shuffle',
    desc: 'Visualize branch prediction with 2-bit saturating counters.',
  },
  {
    name: 'Concurrency Simulator',
    path: '/pages/visualizers/concurrency-simulator/concurrency-simulator.html',
    category: 'Systems & OS',
    icon: 'fa-layer-group',
    desc: 'Simulate threads, locks, semaphores, and race conditions.',
  },
  {
    name: 'Lock-Free Playground',
    path: '/pages/visualizers/lock-free-playground/lock-free-playground.html',
    category: 'Systems & OS',
    icon: 'fa-atom',
    desc: 'Explore lock-free data structures with CAS operations visualized.',
  },
  {
    name: 'TCP Visualizer',
    path: '/pages/visualizers/tcp-visualizer/tcp-visualizer.html',
    category: 'Systems & OS',
    icon: 'fa-envelope',
    desc: 'Visualize TCP handshake, congestion control, and flow control.',
  },
  {
    name: 'Git Visualizer',
    path: '/pages/ai-features/git-visualizer/git-visualizer.html',
    category: 'Systems & OS',
    icon: 'fa-code-branch',
    desc: 'Visualize Git internals: commits, branches, merges, and the DAG commit graph.',
  },
  {
    name: 'External Merge Sort Visualizer',
    path: '/pages/visualizers/external-merge-sort-visualizer/external-merge-sort-visualizer.html',
    category: 'Systems & OS',
    icon: 'fa-hard-drive',
    desc: 'Sort data larger than memory — run generation, k-way merge, and disk I/O cost tracking.',
  },
  {
    name: 'ARIES Recovery Simulator',
    path: '/pages/visualizers/aries-simulator/aries-simulator.html',
    category: 'Systems & OS',
    icon: 'fa-database',
    desc: 'Visualize ARIES database recovery: Analysis, Redo, and Undo phases.',
  },
  {
    name: 'Spanning Tree Protocol (STP)',
    path: '/pages/visualizers/stp-simulator/stp-simulator.html',
    category: 'Systems & OS',
    icon: 'fa-network-wired',
    desc: 'Simulate STP to prevent network loops and elect root bridges.',
  },

  // ── CPU Scheduling ──
  {
    name: 'FCFS Visualizer',
    path: '/pages/visualizers/fcfs-visualizer/fcfs-visualizer.html',
    category: 'CPU Scheduling',
    icon: 'fa-list',
    desc: 'First Come First Serve CPU scheduling with Gantt chart visualization.',
  },
  {
    name: 'SJF Visualizer',
    path: '/pages/visualizers/sjf-visualizer/sjf-visualizer.html',
    category: 'CPU Scheduling',
    icon: 'fa-ruler',
    desc: 'Shortest Job First scheduling with average wait time calculation.',
  },
  {
    name: 'SRTF Visualizer',
    path: '/pages/visualizers/srtf-visualizer/srtf-visualizer.html',
    category: 'CPU Scheduling',
    icon: 'fa-stopwatch',
    desc: 'Shortest Remaining Time First preemptive scheduling visualized.',
  },
  {
    name: 'Round Robin Visualizer',
    path: '/pages/visualizers/rr-visualizer/rr-visualizer.html',
    category: 'CPU Scheduling',
    icon: 'fa-arrows-rotate',
    desc: 'Round Robin scheduling with adjustable time quantum.',
  },
  {
    name: 'Priority Scheduling Visualizer',
    path: '/pages/visualizers/priority-scheduling-visualizer/priority-scheduling-visualizer.html',
    category: 'CPU Scheduling',
    icon: 'fa-star',
    desc: 'Non-preemptive priority-based CPU scheduling visualization.',
  },
  {
    name: 'Priority Preemptive Visualizer',
    path: '/pages/visualizers/priority-preemptive-visualizer/priority-preemptive-visualizer.html',
    category: 'CPU Scheduling',
    icon: 'fa-arrow-up',
    desc: 'Preemptive priority scheduling with context switch tracking.',
  },
  {
    name: 'MLFQ Scheduling Visualizer',
    path: '/pages/visualizers/mlfq-scheduling-visualizer/mlfq-scheduling-visualizer.html',
    category: 'CPU Scheduling',
    icon: 'fa-chart-bar',
    desc: 'Multi-Level Feedback Queue — the classic OS scheduling algorithm.',
  },

  // ── Distributed Systems ──
  {
    name: 'Raft Simulator',
    path: '/pages/ai-features/raft-simulator/raft-simulator.html',
    category: 'Distributed Systems',
    icon: 'fa-anchor',
    desc: 'Interactive Raft consensus algorithm: leader election and log replication.',
  },
  {
    name: 'PBFT Simulator',
    path: '/pages/visualizers/pbft-simulator/pbft-simulator.html',
    category: 'Distributed Systems',
    icon: 'fa-shield-halved',
    desc: 'Practical Byzantine Fault Tolerance consensus visualized.',
  },
  {
    name: 'Load Balancer Visualizer',
    path: '/pages/visualizers/load-balancer-visualizer/load-balancer-visualizer.html',
    category: 'Distributed Systems',
    icon: 'fa-network-wired',
    desc: 'Visualize real-time traffic distribution across backend servers using diverse algorithms, with failure simulations.',
  },
  {
    name: 'Consistent Hashing Visualizer',
    path: '/pages/visualizers/consistent-hashing-visualizer/consistent-hashing-visualizer.html',
    category: 'Distributed Systems',
    icon: 'fa-bullseye',
    desc: 'Distribute keys across nodes with consistent hashing ring.',
  },
  {
    name: 'Chord DHT Ring Simulator',
    path: '/pages/visualizers/chord-simulator/chord-simulator.html',
    category: 'Distributed Systems',
    icon: 'fa-circle-notch',
    desc: 'Interactive Chord DHT simulator demonstrating finger table dynamic calculation and routing paths.',
  },
  {
    name: 'Kafka Simulator',
    path: '/pages/visualizers/kafka-simulator/kafka-simulator.html',
    category: 'Distributed Systems',
    icon: 'fa-envelope',
    desc: 'Simulate Apache Kafka topics, partitions, and consumer groups.',
  },
  {
    name: 'BitTorrent Swarm Simulator',
    path: '/pages/visualizers/bittorrent-simulator/bittorrent-simulator.html',
    category: 'Distributed Systems',
    icon: 'fa-project-diagram',
    desc: 'Simulate a P2P swarm with Rarest-First piece selection and Tit-for-Tat choking.',
  },
  {
    name: 'Operational Transformation (OT) Simulator',
    path: '/pages/visualizers/ot-simulator/ot-simulator.html',
    category: 'Distributed Systems',
    icon: 'fa-random',
    desc: 'Interactive OT network simulator showing transformation math and conflict resolution.',
  },
  {
    name: 'Paxos Consensus Protocol Simulator',
    path: '/pages/visualizers/paxos-simulator/paxos-simulator.html',
    category: 'Distributed Systems',
    icon: 'fa-network-wired',
    desc: 'Interactive Paxos message exchange simulator demonstrating proposal consensus and network partitions.',
  },
  {
    name: 'Redlock Simulator',
    path: '/pages/visualizers/redlock-simulator/redlock-simulator.html',
    category: 'Distributed Systems',
    icon: 'fa-lock',
    desc: 'Redis-based distributed lock algorithm simulation.',
  },
  {
    name: 'Epidemic Protocol Simulator',
    path: '/pages/visualizers/epidemic-protocol-simulator/epidemic-protocol-simulator.html',
    category: 'Distributed Systems',
    icon: 'fa-share-nodes',
    desc: 'Gossip-based epidemic broadcasting and failure detection.',
  },
  {
    name: 'MapReduce Simulator',
    path: '/pages/visualizers/map-reduce-simulator/map-reduce-simulator.html',
    category: 'Distributed Systems',
    icon: 'fa-map',
    desc: 'Visualize Map and Reduce phases in distributed data processing.',
  },
  {
    name: 'MapReduce Orchestrator',
    path: '/pages/visualizers/mapreduce-orchestrator/mapreduce-orchestrator.html',
    category: 'Distributed Systems',
    icon: 'fa-diagram-project',
    desc: 'Orchestrate multi-stage MapReduce jobs with DAG visualization.',
  },
  {
    name: 'CRDT Visualizer',
    path: '/pages/visualizer/crdt-visualizer/crdt-visualizer.html',
    category: 'Distributed Systems',
    icon: 'fa-arrows-rotate',
    desc: 'Conflict-free Replicated Data Types for eventual consistency.',
  },
  {
    name: 'MVCC Simulator',
    path: '/pages/visualizer/mvcc-simulator/mvcc-simulator.html',
    category: 'Distributed Systems',
    icon: 'fa-pen',
    desc: 'Multi-Version Concurrency Control in database transactions.',
  },
  {
    name: 'DHT XOR Visualizer',
    path: '/pages/visualizers/dht-xor-visualizer/dht-xor-visualizer.html',
    category: 'Distributed Systems',
    icon: 'fa-calculator',
    desc: 'Kademlia Distributed Hash Table with XOR distance metric.',
  },
  {
    name: 'MPT Visualizer',
    path: '/pages/visualizers/mpt-visualizer/mpt-visualizer.html',
    category: 'Distributed Systems',
    icon: 'fa-tree',
    desc: 'Merkle Patricia Trie — the data structure behind Ethereum state.',
  },
  {
    name: 'Skip Graph Visualizer',
    path: '/pages/visualizers/skip-graph-visualizer/skip-graph-visualizer.html',
    category: 'Distributed Systems',
    icon: 'fa-chart-line',
    desc: 'Peer-to-peer skip graph for efficient distributed search.',
  },
  {
    name: 'Rsync Simulator',
    path: '/pages/visualizers/rsync-simulator/rsync-simulator.html',
    category: 'Distributed Systems',
    icon: 'fa-clone',
    desc: 'Simulate the Rsync algorithm showing rolling hashes and delta transfers.',
  },

  // ── Security & Cryptography ──
  {
    name: 'RSA Cryptography Visualizer',
    path: '/pages/visualizers/rsa-visualizer/rsa-visualizer.html',
    category: 'Security & Crypto',
    icon: 'fa-lock',
    desc: 'Walk through RSA key generation, encryption, and decryption.',
  },
  {
    name: 'ZKP Visualizer',
    path: '/pages/visualizers/zkp-visualizer/zkp-visualizer.html',
    category: 'Security & Crypto',
    icon: 'fa-user-secret',
    desc: 'Zero-Knowledge Proof concepts visualized step by step.',
  },
  {
    name: 'Shamir Secret Sharing',
    path: '/pages/visualizers/shamir-visualizer/shamir-visualizer.html',
    category: 'Security & Crypto',
    icon: 'fa-key',
    desc: "Visualize Shamir's secret sharing with polynomial interpolation.",
  },
  {
    name: 'Differential Privacy Sandbox',
    path: '/pages/visualizers/differential-privacy-sandbox/differential-privacy-sandbox.html',
    category: 'Security & Crypto',
    icon: 'fa-shield-halved',
    desc: 'Explore differential privacy with epsilon budgets and noise addition.',
  },
  {
    name: 'FHE Visualizer',
    path: '/pages/visualizers/fhe-evaluator/fhe-evaluator.html',
    category: 'Security & Crypto',
    icon: 'fa-eye',
    desc: 'Fully Homomorphic Encryption — compute on encrypted data.',
  },
  {
    name: 'ORAM Simulator',
    path: '/pages/visualizers/oram-simulator/oram-simulator.html',
    category: 'Security & Crypto',
    icon: 'fa-box',
    desc: 'Oblivious RAM — hide memory access patterns from adversaries.',
  },
  {
    name: 'AES Round Visualizer',
    path: '/pages/visualizers/aes-visualizer/aes-visualizer.html',
    category: 'Security & Crypto',
    icon: 'fa-shield-halved',
    desc: 'Step-by-step interactive visualizer for the AES (Advanced Encryption Standard) encryption rounds.',
  },

  // ── Math, Geometry & Signals ──
  {
    name: 'FFT Visualizer',
    path: '/pages/visualizer/fft-visualizer/fft-visualizer.html',
    category: 'Math & Geometry',
    icon: 'fa-chart-line',
    desc: 'Fast Fourier Transform — convert between time and frequency domains.',
  },
  {
    name: 'Convex Hull Visualizer',
    path: '/pages/visualizers/convex-hull/convex-hull.html',
    category: 'Math & Geometry',
    icon: 'fa-draw-polygon',
    desc: 'Graham Scan and Jarvis March for convex hull computation.',
  },
  {
    name: 'L-System Fractal Generator',
    path: '/pages/visualizers/l-system-fractal/l-system-fractal.html',
    category: 'Math & Geometry',
    icon: 'fa-seedling',
    desc: 'Generate fractal patterns using Lindenmayer systems.',
  },
  {
    name: 'Markov Chain Visualizer',
    path: '/pages/visualizers/markov-chain-visualizer/markov-chain-visualizer.html',
    category: 'Math & Geometry',
    icon: 'fa-link',
    desc: 'Visualize Markov chains with state transition probabilities.',
  },
  {
    name: 'Spatial Visualizer',
    path: '/pages/visualizers/spatial-visualizer/spatial-visualizer.html',
    category: 'Math & Geometry',
    icon: 'fa-map',
    desc: 'Spatial data structures: quadtrees, R-trees, and spatial hashing.',
  },
  {
    name: 'TSP Heuristics Visualizer',
    path: '/pages/visualizers/tsp-heuristics/tsp-heuristics.html',
    category: 'Math & Geometry',
    icon: 'fa-earth-americas',
    desc: 'Traveling Salesman Problem solvers: nearest neighbor, 2-opt, and more.',
  },

  // ── AI & Machine Learning ──
  {
    name: 'CNN Layer & Feature Map Explorer',
    path: '/pages/visualizers/cnn-visualizer/cnn-visualizer.html',
    category: 'AI & ML',
    icon: 'fa-images',
    desc: 'Visualize how convolution, pooling, ReLU, and dense layers extract features from images.',
  },
  {
    name: 'Neural Network Backpropagation',
    path: '/pages/visualizers/nn-backprop-visualizer/nn-backprop-visualizer.html',
    category: 'AI & ML',
    icon: 'fa-brain',
    desc: 'Watch gradient descent and backpropagation update neural weights.',
  },
  {
    name: 'Transformer Self-Attention',
    path: '/pages/visualizer/attention-visualizer/attention-visualizer.html',
    category: 'AI & ML',
    icon: 'fa-eye',
    desc: 'Visualize attention heads in Transformer architectures.',
  },
  {
    name: 'LLM Inference Visualizer',
    path: '/pages/visualizers/llm-inference/llm-inference.html',
    category: 'AI & ML',
    icon: 'fa-robot',
    desc: 'See how large language models generate tokens step by step.',
  },
  {
    name: 'Go Scheduler Visualizer',
    path: '/pages/visualizers/go-scheduler/go-scheduler.html',
    category: 'AI & ML',
    icon: 'fa-shuffle',
    desc: "Visualize Go's M:N scheduler with goroutines and OS threads.",
  },
  {
    name: 'WASM SQL Visualizer',
    path: '/pages/ai-features/wasm-sql-visualizer/wasm-sql-visualizer.html',
    category: 'AI & ML',
    icon: 'fa-database',
    desc: 'SQL query execution visualized via WebAssembly SQLite.',
  },
  {
    name: 'BVH Raytracer',
    path: '/pages/ai-features/bvh-raytracer/bvh-raytracer.html',
    category: 'AI & ML',
    icon: 'fa-palette',
    desc: 'Bounding Volume Hierarchy for accelerated ray tracing.',
  },

  // ── Data Structures ──
  {
    name: 'Linked List Visualizer',
    path: '/pages/visualizers/linked-list-visualizer/linked-list-visualizer.html',
    category: 'Data Structures',
    icon: 'fa-link',
    desc: 'Interactive singly linked list with insert, delete, and search.',
  },
  {
    name: 'Doubly Linked List Visualizer',
    path: '/pages/visualizers/doubly-linked-list-visualizer/doubly-linked-list-visualizer.html',
    category: 'Data Structures',
    icon: 'fa-link',
    desc: 'Doubly linked list with forward and backward traversal.',
  },
  {
    name: 'Circular Linked List',
    path: '/pages/visualizers/circular-linked-list/circular-linked-list.html',
    category: 'Data Structures',
    icon: 'fa-circle',
    desc: 'Circular linked list with insertion and deletion operations.',
  },
  {
    name: 'Stack & Queue Visualizer',
    path: '/pages/visualizers/stack-queue-visualizer/stack-queue-visualizer.html',
    category: 'Data Structures',
    icon: 'fa-book',
    desc: 'Visualize stack (LIFO) and queue (FIFO) operations.',
  },
  {
    name: 'Amortized Cost Sandbox',
    path: '/pages/visualizers/amortized-cost-sandbox/amortized-cost-sandbox.html',
    category: 'Data Structures',
    icon: 'fa-chart-column',
    desc: 'Push/resize cost bars and cumulative average — visual proof of amortized O(1) for dynamic arrays and hash maps.',
  },
  {
    name: 'Bloom Filter Visualizer',
    path: '/pages/visualizers/bloom-filter-visualizer/bloom-filter-visualizer.html',
    category: 'Data Structures',
    icon: 'fa-filter',
    desc: 'Probabilistic membership testing with Bloom filters.',
  },
  {
    name: 'Skip List Visualizer',
    path: '/pages/visualizers/skip-list-visualizer/skip-list-visualizer.html',
    category: 'Data Structures',
    icon: 'fa-forward-step',
    desc: 'Probabilistic balanced data structure visualized with levels.',
  },
  {
    name: 'Probabilistic Structures',
    path: '/pages/visualizers/probabilistic-structures/probabilistic-structures.html',
    category: 'Data Structures',
    icon: 'fa-dice',
    desc: 'Compare Count-Min Sketch, HyperLogLog, and Bloom filters.',
  },
  {
    name: "MO's Algorithm Visualizer",
    path: '/pages/visualizers/mos-algorithm/mos-algorithm.html',
    category: 'Data Structures',
    icon: 'fa-ruler',
    desc: 'Square-root decomposition for range query optimization.',
  },
  {
    name: 'Quadtree Collision Visualizer',
    path: '/pages/visualizers/quadtree-collision/quadtree-collision.html',
    category: 'Data Structures',
    icon: 'fa-border-all',
    desc: 'Spatial partitioning with quadtrees for collision detection.',
  },
  {
    name: '2PC Visualizer',
    path: '/pages/visualizers/2pc-visualizer/2pc-visualizer.html',
    category: 'Data Structures',
    icon: 'fa-handshake',
    desc: 'Two-Phase Commit protocol for distributed transactions.',
  },
  {
    name: 'Docker Visualizer',
    path: '/pages/visualizers/docker-visualizer/docker-visualizer.html',
    category: 'Data Structures',
    icon: 'fa-cube',
    desc: 'Container architecture: images, layers, volumes, and networking.',
  },
  {
    name: 'RDBMS Visualizer',
    path: '/pages/visualizers/rdbms-visualizer/rdbms-visualizer.html',
    category: 'Data Structures',
    icon: 'fa-database',
    desc: 'Relational database internals: B-trees, pages, and query planning.',
  },
  {
    name: 'Memory Layout Explorer',
    path: '/pages/visualizers/data-structure-memory-layout-explorer/data-structure-memory-layout-explorer.html',
    category: 'Data Structures',
    icon: 'fa-memory',
    desc: 'See how arrays, linked lists, trees, hash tables, queues, and stacks are laid out in memory.',
  },
  {
    name: 'SDLC Visualizer',
    path: '/pages/visualizers/sdlc-visualizer/sdlc-visualizer.html',
    category: 'Data Structures',
    icon: 'fa-list',
    desc: 'Software Development Life Cycle with agile and waterfall models.',
  },
  {
    name: 'HNSW Visualizer',
    path: '/pages/ai-features/hnsw-visualizer/hnsw-visualizer.html',
    category: 'Data Structures',
    icon: 'fa-sitemap',
    desc: 'Explore Hierarchical Navigable Small World graphs for approximate nearest neighbor search.',
  },
  {
    name: 'Cuckoo Hashing Visualizer',
    path: '/pages/visualizers/cuckoo-hashing-visualizer/cuckoo-hashing-visualizer.html',
    category: 'Data Structures',
    icon: 'fa-table-cells',
    desc: 'Guaranteed O(1) worst-case lookup via two tables and eviction chains.',
  },
  {
    name: 'LSH Visualizer',
    path: '/pages/visualizers/lsh-visualizer/lsh-visualizer.html',
    category: 'Algorithms',
    icon: 'fa-fingerprint',
    desc: 'Locality-Sensitive Hashing — MinHash signatures, banding, and approximate nearest-neighbor search without comparing all pairs.',
  },
  {
    name: 'Rope Data Structure Visualizer',
    path: '/pages/visualizers/rope-data-structure-visualizer/rope-data-structure-visualizer.html',
    category: 'Data Structures',
    icon: 'fa-align-left',
    desc: 'How VS Code and Google Docs edit huge documents in O(log n) — split, concat, and weight-guided indexing.',
  },

  // ── Special & Creative ──
  {
    name: 'Flowchart Builder',
    path: '/pages/visualizers/flowchart-builder/flowchart-builder.html',
    category: 'Special',
    icon: 'fa-project-diagram',
    desc: 'Drag-and-drop flowchart builder for algorithm design.',
  },
  {
    name: 'Turing Machine Simulator',
    path: '/pages/visualizers/turing-machine-simulator/turing-machine-simulator.html',
    category: 'Special',
    icon: 'fa-floppy-disk',
    desc: 'Program and run your own Turing machine with tape and states.',
  },
  {
    name: 'Minimax & Alpha-Beta',
    path: '/pages/visualizers/minimax-visualizer/minimax-visualizer.html',
    category: 'Special',
    icon: 'fa-chess',
    desc: 'Game AI tree search with minimax and alpha-beta pruning.',
  },
  {
    name: 'Suffix Automaton Explorer',
    path: '/pages/visualizers/suffix-automaton-explorer/suffix-automaton-explorer.html',
    category: 'Special',
    icon: 'fa-dna',
    desc: 'Build and query suffix automata for advanced string processing.',
  },
  {
    name: 'Regex Automata Visualizer',
    path: '/pages/ai-features/regex-automata-visualizer/regex-automata-visualizer.html',
    category: 'Special',
    icon: 'fa-diagram-project',
    desc: 'Build and simulate regular expressions as NFA/DFA automata step by step.',
  },
  {
    name: 'LL(1) / LR(1) Parser Engine',
    path: '/pages/ai-features/parser-engine/parser-engine.html',
    category: 'Special',
    icon: 'fa-diagram-project',
    desc: 'Build, analyze, and visualize LL(1) and LR(1) parsing tables, item sets, FIRST/FOLLOW, and live parse tree AST generation.',
  },
  {
    name: 'Anytime Algorithms Lab',
    path: '/pages/visualizers/anytime-algorithms-lab/anytime-algorithms-lab.html',
    category: 'Special',
    icon: 'fa-stopwatch',
    desc: 'Algorithms that return better results given more time.',
  },
  {
    name: 'Persistent Data Structure Lab',
    path: '/pages/visualizers/persistent-ds-lab/persistent-ds-lab.html',
    category: 'Special',
    icon: 'fa-clock',
    desc: 'Explore persistent versions of arrays, trees, and linked lists.',
  },
  {
    name: 'Algorithm Genome',
    path: '/pages/visualizers/algorithm-genome/algorithm-genome.html',
    category: 'Special',
    icon: 'fa-dna',
    desc: 'Genetic algorithm evolution visualized with selection and mutation.',
  },
  {
    name: 'DSA Story Mode',
    path: '/pages/visualizers/dsa-story/dsa-story-mode.html',
    category: 'Special',
    icon: 'fa-book',
    desc: 'Learn DSA concepts through an interactive story-driven journey.',
  },
  {
    name: 'Algorithm Timeline',
    path: '/pages/visualizers/algorithm-timeline/algorithm-timeline.html',
    category: 'Special',
    icon: 'fa-calendar',
    desc: 'Explore the history and evolution of computer science algorithms.',
  },
  {
    name: 'Algorithm Fossil Record',
    path: '/pages/visualizers/algorithm-fossil-record/algorithm-fossil-record.html',
    category: 'Special',
    icon: 'fa-history',
    desc: 'Discover ancient and obsolete algorithms from computing history.',
  },
  {
    name: 'Algorithm Family Tree',
    path: '/pages/visualizers/algorithm-family-tree/algorithm-family-tree.html',
    category: 'Special',
    icon: 'fa-tree',
    desc: 'Visualize relationships and influences between algorithms.',
  },
  {
    name: 'Algorithm Music Composer',
    path: '/pages/visualizers/algorithm-music-composer/algorithm-music-composer.html',
    category: 'Special',
    icon: 'fa-music',
    desc: 'Hear algorithms — sorting, graphs, and trees composed into music.',
  },
  {
    name: 'Algorithm Art Gallery',
    path: '/pages/visualizers/algorithim-art-gallery/algorithm-art-gallery.html',
    category: 'Special',
    icon: 'fa-palette',
    desc: 'Generative algorithm art created from data structure visualizations.',
  },
  {
    name: 'Global Learning Globe',
    path: '/pages/visualizers/global-learning-globe/global-learning-globe.html',
    category: 'Special',
    icon: 'fa-globe',
    desc: 'Explore DSA concepts visualized on a 3D interactive globe.',
  },
  {
    name: 'Code Execution Visualizer',
    path: '/code-visualizer/index.html',
    category: 'Special',
    icon: 'fa-play',
    desc: 'Step through code execution with line-by-line variable tracking.',
  },
  {
    name: 'Backprop Engine',
    path: '/pages/visualizers/backprop-engine/backprop-engine.html',
    category: 'Special',
    icon: 'fa-bolt',
    desc: 'Automatic differentiation engine for neural network training.',
  },
  {
    name: 'V8 Visualizer',
    path: '/pages/visualizers/v8-visualizer/v8-visualizer.html',
    category: 'Special',
    icon: 'fa-gear',
    desc: 'Visualize V8 JavaScript engine compilation and optimization.',
  },
  {
    name: 'Spectre Visualizer',
    path: '/pages/visualizers/spectre-visualizer/spectre-visualizer.html',
    category: 'Special',
    icon: 'fa-eye',
    desc: 'Spectre side-channel attack — speculative execution visualized.',
  },
  {
    name: 'DNS Resolution Visualizer',
    path: '/pages/visualizers/dns-simulator/dns-simulator.html',
    category: 'Distributed Systems',
    icon: 'fa-globe',
    desc: 'Visualize the complete DNS lookup process from browser cache to authoritative name servers.',
  },
  {
    name: 'Consistent Hashing Visualizer',
    path: '/pages/visualizers/consistent-hashing-simulator/consistent-hashing-simulator.html',
    category: 'Systems & OS',
    icon: 'fa-server',
    desc: 'Interactive hash ring showing node distribution and key routing.',
  },
  {
    name: 'gRPC & HTTP/2 Multiplexing Visualizer',
    path: '/pages/visualizers/grpc-simulator/grpc-simulator.html',
    category: 'Architecture',
    icon: 'fa-network-wired',
    desc: 'Compare HTTP/1.1 REST to HTTP/2 multiplexed streams and Protocol Buffers.',
  },
  {
    name: 'WebRTC Signaling & ICE Simulator',
    path: '/pages/visualizers/webrtc-simulator/webrtc-simulator.html',
    category: 'Systems & OS',
    icon: 'fa-tower-broadcast',
    desc: 'Visualize Peer-to-Peer connections, STUN hole-punching, and TURN relays.',
  },
  {
    name: 'GraphQL N+1 & DataLoader Visualizer',
    path: '/pages/visualizers/graphql-n1-simulator/graphql-n1-simulator.html',
    category: 'Architecture',
    icon: 'fa-diagram-project',
    desc: 'Visualize naive GraphQL resolvers causing the N+1 problem, and how DataLoader batches requests.',
  },
  {
    name: 'WebAssembly Memory & Interop Visualizer',
    path: '/pages/visualizers/wasm-memory-simulator/wasm-memory-simulator.html',
    category: 'Systems & OS',
    icon: 'fa-memory',
    desc: 'Understand WebAssembly linear memory and how it exchanges data with JavaScript.',
  },
  {
    name: 'Snowflake Distributed ID Visualizer',
    path: '/pages/visualizers/snowflake-id-visualizer/snowflake-id-visualizer.html',
    category: 'Architecture',
    icon: 'fa-bolt',
    desc: 'Generate highly-scalable 64-bit unique identifiers using timestamps and machine IDs.',
  },
  {
    name: 'Aho-Corasick Automaton Builder',
    path: '/pages/visualizers/aho-corasick-visualizer/aho-corasick-visualizer.html',
    category: 'AI & ML',
    icon: 'fa-star',
    desc: 'Build an Aho-Corasick automaton from multiple patterns, watch failure links form via BFS, and search text in a single O(n) pass — the algorithm behind antivirus scanners and IDS systems.',
  },
  {
    name: 'Floyd-Warshall Visualizer',
    path: '/pages/visualizers/floyd-warshall-visualizer/floyd-warshall-visualizer.html',
    category: 'AI & ML',
    icon: 'fa-project-diagram',
    desc: 'Interactive Floyd-Warshall (All-Pairs Shortest Path) visualizer with 2D distance matrix animation and negative cycle detection.',
  },
  {
    name: 'MCTS Game Theory Visualizer | Algo-Infinity-Verse',
    path: '/pages/visualizers/mcts-game-theory-visualizer/mcts-game-theory-visualizer.html',
    category: 'AI & ML',
    icon: 'fa-brain',
    desc: 'Interactive MCTS Game Theory Visualizer | Algo-Infinity-Verse visualization.',
  },
  {
    name: 'Quantum Circuit Playground',
    path: '/pages/visualizers/quantum-circuit-playground/quantum-circuit-playground.html',
    category: 'AI & ML',
    icon: 'fa-clock',
    desc: 'Build quantum circuits gate by gate. Watch superposition, entanglement, and Grover',
  },
  {
    name: 'Algo Infinity Verse | HLD Learning',
    path: '/pages/visualizers/hld-learning/hld-learning.html',
    category: 'Algorithms',
    icon: 'fa-shapes',
    desc: 'Interactive Algo Infinity Verse | HLD Learning visualization.',
  },
  {
    name: 'Algo Infinity Verse | Max Flow Playground',
    path: '/pages/visualizers/network-flow/network-flow.html',
    category: 'Algorithms',
    icon: 'fa-clock',
    desc: 'Interactive Algo Infinity Verse | Max Flow Playground visualization.',
  },
  {
    name: 'Ant Colony Optimization Visualizer | Algo-Infinity-Verse',
    path: '/pages/visualizers/aco-swarm-intelligence-visualizer/aco-swarm-intelligence-visualizer.html',
    category: 'Algorithms',
    icon: 'fa-shapes',
    desc: 'Interactive Ant Colony Optimization Visualizer | Algo-Infinity-Verse visualization.',
  },
  {
    name: "Banker's Algorithm & Deadlock Detection · Algo Infinity Verse",
    path: '/pages/visualizers/bankers/bankers.html',
    category: 'Algorithms',
    icon: 'fa-microchip',
    desc: 'A Resource Safety Engine — Banker',
  },
  {
    name: 'BGP Route Propagation & Hijacking Simulator | Algo-Infinity-Verse',
    path: '/pages/visualizers/bgp-route-hijack-simulator/bgp-route-hijack-simulator.html',
    category: 'Algorithms',
    icon: 'fa-shapes',
    desc: 'Interactive BGP Route Propagation & Hijacking Simulator | Algo-Infinity-Verse visualization.',
  },
  {
    name: 'Centroid Decomposition Visualizer · Algo Infinity Verse',
    path: '/pages/visualizers/centroid/centroid.html',
    category: 'Algorithms',
    icon: 'fa-microchip',
    desc: 'Interactive Centroid Decomposition Visualizer · Algo Infinity Verse visualization.',
  },
  {
    name: 'DPLL 3-SAT Solver Visualizer | Algo-Infinity-Verse',
    path: '/pages/visualizers/dpll-3sat-solver-visualizer/dpll-3sat-solver-visualizer.html',
    category: 'Algorithms',
    icon: 'fa-bullseye',
    desc: 'Interactive DPLL 3-SAT Solver Visualizer | Algo-Infinity-Verse visualization.',
  },
  {
    name: "Fortune's Sweepline Engine",
    path: '/pages/visualizers/fortunes-sweepline/fortunes-sweepline.html',
    category: 'Algorithms',
    icon: 'fa-shapes',
    desc: "Interactive Fortune's Sweepline Engine visualization.",
  },
  {
    name: "Grover's Algorithm Visualizer | Algo-Infinity-Verse",
    path: '/pages/visualizers/grovers-algorithm-visualizer/grovers-algorithm-visualizer.html',
    category: 'Algorithms',
    icon: 'fa-shapes',
    desc: "Interactive Grover's Algorithm Visualizer | Algo-Infinity-Verse visualization.",
  },
  {
    name: 'K-Means Clustering Visualizer',
    path: '/pages/visualizers/kmeans-visualizer/kmeans-visualizer.html',
    category: 'Algorithms',
    icon: 'fa-shapes',
    desc: 'Interactive 2D visualization of the K-Means Clustering algorithm.',
  },
  {
    name: 'LZ77 Data Compression Visualizer | Algo-Infinity-Verse',
    path: '/pages/visualizers/3-lz77-compression-visualizer/3-lz77-compression-visualizer.html',
    category: 'Algorithms',
    icon: 'fa-calculator',
    desc: 'Interactive LZ77 Data Compression Visualizer | Algo-Infinity-Verse visualization.',
  },
  {
    name: 'SWIM Protocol Simulator - Algo Infinity Verse',
    path: '/pages/visualizers/swim-simulator/swim-simulator.html',
    category: 'Algorithms',
    icon: 'fa-network-wired',
    desc: 'Interactive SWIM Protocol Simulator - Algo Infinity Verse visualization.',
  },
  {
    name: 't-Digest Percentile Estimator',
    path: '/pages/visualizers/tdigest-percentile-estimator/tdigest-percentile-estimator.html',
    category: 'Algorithms',
    icon: 'fa-shapes',
    desc: 'See how monitoring dashboards estimate p50/p95/p99 latency from millions of requests using a handful of adaptive centroids instead of storing every value.',
  },
  {
    name: 'Kinetic Heap Playground',
    path: '/pages/visualizers/kinetic-heap-playground/kinetic-heap-playground.html',
    category: 'CPU Scheduling',
    icon: 'fa-tree',
    desc: 'Watch a kinetic heap track the maximum-priority moving object over continuous time using certificates instead of re-sorting every frame.',
  },
  {
    name: 'Link-Cut Trees · Algo Infinity Verse',
    path: '/pages/visualizers/link-cut-tree/link-cut-tree.html',
    category: 'CPU Scheduling',
    icon: 'fa-tree',
    desc: 'A Represented-Tree Engine — watch access(v) splay auxiliary trees, re-link preferred children, and walk path-parent pointers to expose the root-to-v path, backed by a genuine splay-tree implementation.',
  },
  {
    name: "Manacher's Algorithm · Algo Infinity Verse",
    path: '/pages/visualizers/manacher/manacher.html',
    category: 'CPU Scheduling',
    icon: 'fa-shapes',
    desc: 'A Mirror-Symmetry Engine visualizer for Manacher',
  },
  {
    name: 'Median of Two Sorted Arrays',
    path: '/pages/visualizers/median-sorted-arrays/median-sorted-arrays.html',
    category: 'CPU Scheduling',
    icon: 'fa-chart-bar',
    desc: 'Interactive Median of Two Sorted Arrays visualization.',
  },
  {
    name: 'Morris Traversal O(1) Space Visualizer | Algo-Infinity-Verse',
    path: '/pages/visualizers/morrisvisualizer/morrisvisualizer.html',
    category: 'CPU Scheduling',
    icon: 'fa-clock',
    desc: 'Interactive Morris Traversal O(1) Space Visualizer | Algo-Infinity-Verse visualization.',
  },
  {
    name: 'Online Algorithms Arena',
    path: '/pages/visualizers/online-algorithms-arena/online-algorithms-arena.html',
    category: 'CPU Scheduling',
    icon: 'fa-shapes',
    desc: 'Ski Rental and Online Interval Scheduling — decide with no knowledge of the future, then compare against the all-knowing offline optimum via competitive ratio.',
  },
  {
    name: 'Palindromic Tree (Eertree) · Algo Infinity Verse',
    path: '/pages/visualizers/eertree/eertree.html',
    category: 'CPU Scheduling',
    icon: 'fa-tree',
    desc: 'A Twin-Root Palindrome Engine — watch the Eertree build online via suffix-link walks, discover new palindromes, and propagate occurrence counts in a real second pass.',
  },
  {
    name: 'Suffix Array & LCP Visualizer | Algo-Infinity-Verse',
    path: '/pages/visualizers/suffix-array-lcp/suffix-array-lcp.html',
    category: 'CPU Scheduling',
    icon: 'fa-search',
    desc: 'Interactive Suffix Array & LCP Visualizer | Algo-Infinity-Verse visualization.',
  },
  {
    name: 'Vector Clocks Visualizer',
    path: '/pages/visualizers/vector-clocks-visualizer/vector-clocks-visualizer.html',
    category: 'CPU Scheduling',
    icon: 'fa-microchip',
    desc: 'See how distributed systems detect causality without a shared clock — vector clock increments, message merges, and the happened-before vs concurrent distinction.',
  },
  {
    name: 'Towers of Hanoi Visualizer',
    path: '/pages/visualizers/towers-of-hanoi-visualizer/towers-of-hanoi-visualizer.html',
    category: 'Data Structures',
    icon: 'fa-shapes',
    desc: 'Interactive Towers of Hanoi Visualizer. Visualize the recursive call stack and animated disk movements.',
  },
  {
    name: 'API Gateway Visualizer',
    path: '/pages/visualizers/api-gateway-visualizer/api-gateway-visualizer.html',
    category: 'Distributed Systems',
    icon: 'fa-network-wired',
    desc: 'Simulate and visualize API Gateway concepts like JWT Authentication, Rate Limiting, and Routing.',
  },
  {
    name: 'API Rate Limiting Visualizer',
    path: '/pages/visualizers/api-rate-limiter-visualizer/api-rate-limiter-visualizer.html',
    category: 'Distributed Systems',
    icon: 'fa-network-wired',
    desc: 'Simulate and visualize Token Bucket, Leaky Bucket, Fixed Window, and Sliding Window rate limiting algorithms.',
  },
  {
    name: 'Consistent Hashing Ring',
    path: '/pages/visualizers/consistent-hashing-ring/consistent-hashing-ring.html',
    category: 'Distributed Systems',
    icon: 'fa-network-wired',
    desc: 'Interactive consistent hashing ring with virtual nodes — see how DynamoDB and Chord distribute load evenly and migrate only affected keys when servers join or leave.',
  },
  {
    name: 'Service Mesh Visualizer',
    path: '/pages/visualizers/service-mesh-visualizer/service-mesh-visualizer.html',
    category: 'Distributed Systems',
    icon: 'fa-network-wired',
    desc: 'Simulate and visualize Service Mesh concepts like Sidecars, mTLS, Retries, and Circuit Breakers.',
  },
  {
    name: 'Splay Tree Visualizer',
    path: '/pages/visualizers/splay-tree-visualizer/splay-tree-visualizer.html',
    category: 'Distributed Systems',
    icon: 'fa-tree',
    desc: 'Watch a self-adjusting splay tree move accessed nodes to the root via zig, zig-zig, and zig-zag rotations — frequently used items get faster automatically.',
  },
  {
    name: 'Longest Common Subsequence (2D DP) Visualizer',
    path: '/pages/visualizers/lcs-visualizer/lcs-visualizer.html',
    category: 'Dynamic Programming',
    icon: 'fa-bullseye',
    desc: 'Interactive Longest Common Subsequence (2D DP) Visualizer visualization.',
  },
  {
    name: 'A* Pathfinding Visualizer',
    path: '/pages/visualizers/astar-pathfinding/astar-pathfinding.html',
    category: 'Graph Algorithms',
    icon: 'fa-project-diagram',
    desc: 'Interactive A* Pathfinding Visualizer visualization.',
  },
  {
    name: "Dijkstra's Algorithm Visualizer",
    path: '/pages/visualizers/dijkstra-visualizer/dijkstra-visualizer.html',
    category: 'Graph Algorithms',
    icon: 'fa-project-diagram',
    desc: 'Interactive visualizer for Dijkstra',
  },
  {
    name: "Dinic's Algorithm Visualizer | Algo-Infinity-Verse",
    path: '/pages/visualizers/dinics-algorithm/dinics-algorithm.html',
    category: 'Graph Algorithms',
    icon: 'fa-project-diagram',
    desc: "Interactive Dinic's Algorithm Visualizer | Algo-Infinity-Verse visualization.",
  },
  {
    name: 'MST Visualizer (Kruskal vs Prim)',
    path: '/pages/visualizers/mst-visualizer/mst-visualizer.html',
    category: 'Graph Algorithms',
    icon: 'fa-project-diagram',
    desc: 'Visualize and compare Kruskal',
  },
  {
    name: 'PageRank · Algo Infinity Verse',
    path: '/pages/visualizers/pagerank/pagerank.html',
    category: 'Graph Algorithms',
    icon: 'fa-project-diagram',
    desc: 'An interactive visualizer for Google',
  },
  {
    name: 'Push-Relabel Maximum Flow',
    path: '/pages/visualizers/push-relabel/push-relabel.html',
    category: 'Graph Algorithms',
    icon: 'fa-project-diagram',
    desc: 'Interactive Push-Relabel Maximum Flow visualization.',
  },
  {
    name: 'Strongly Connected Components · Algo Infinity Verse',
    path: '/pages/visualizers/strongly-connected-components/strongly-connected-components.html',
    category: 'Graph Algorithms',
    icon: 'fa-calculator',
    desc: 'A Dual-Algorithm SCC Engine — watch Tarjan',
  },
  {
    name: "Tarjan's Algorithm (Bridges)",
    path: '/pages/visualizers/tarjans-bridges/tarjans-bridges.html',
    category: 'Graph Algorithms',
    icon: 'fa-project-diagram',
    desc: "Interactive Tarjan's Algorithm (Bridges) visualization.",
  },
  {
    name: "Tarjan's SCC Visualizer",
    path: '/pages/visualizers/tarjans-scc-visualizer/tarjans-scc-visualizer.html',
    category: 'Graph Algorithms',
    icon: 'fa-project-diagram',
    desc: "Interactive Tarjan's SCC Visualizer visualization.",
  },
  {
    name: 'Algo Infinity Verse | Computational Geometry',
    path: '/pages/visualizers/comp-geometry/comp-geometry.html',
    category: 'Math & Geometry',
    icon: 'fa-calculator',
    desc: 'Interactive Algo Infinity Verse | Computational Geometry visualization.',
  },
  {
    name: 'Count-Min Sketch',
    path: '/pages/visualizers/count-min-sketch/count-min-sketch.html',
    category: 'Math & Geometry',
    icon: 'fa-calculator',
    desc: 'Interactive Count-Min Sketch frequency estimator with collision demo, heavy hitters, and exact vs estimate comparison.',
  },
  {
    name: 'FFT Divide-and-Conquer Visualizer',
    path: '/pages/visualizers/fft-visualizer/fft-visualizer.html',
    category: 'Math & Geometry',
    icon: 'fa-calculator',
    desc: 'Interactive visualizer for the Fast Fourier Transform (FFT) algorithm.',
  },
  {
    name: 'Marching Cubes · Algo Infinity Verse',
    path: '/pages/visualizers/marching-cubes/marching-cubes.html',
    category: 'Math & Geometry',
    icon: 'fa-calculator',
    desc: 'An interactive 3D visualizer for the Marching Cubes isosurface algorithm — sweep a cube through a scalar noise field and watch it build a mesh, triangle by triangle.',
  },
  {
    name: 'BFS vs DFS Visualizer',
    path: '/pages/visualizers/bfs-dfs-visualizer/bfs-dfs-visualizer.html',
    category: 'Security & Crypto',
    icon: 'fa-project-diagram',
    desc: 'Interactive visualizer comparing Breadth-First Search (BFS) and Depth-First Search (DFS) graph traversal algorithms.',
  },
  {
    name: 'Elliptic Curve Cryptography (ECC) Visualizer',
    path: '/pages/visualizers/ecc-finite-field-visualizer/ecc-finite-field-visualizer.html',
    category: 'Security & Crypto',
    icon: 'fa-lock',
    desc: 'Interactive visualizer for Elliptic Curve point operations, scalar multiplication, ECDH key exchange, and ECDSA digital signatures.',
  },
  {
    name: 'JWT Structure and Lifecycle Visualizer',
    path: '/pages/visualizers/jwt-visualizer/jwt-visualizer.html',
    category: 'Security & Crypto',
    icon: 'fa-lock',
    desc: 'Interactive visualizer for JSON Web Token encoding, decoding, and signature verification.',
  },
  {
    name: 'SHA-256 Hashing Visualizer',
    path: '/pages/visualizers/sha256-visualizer/sha256-visualizer.html',
    category: 'Security & Crypto',
    icon: 'fa-network-wired',
    desc: 'Step-by-step interactive visualizer for the SHA-256 cryptographic hashing algorithm.',
  },
  {
    name: 'KMP Pattern Matching',
    path: '/pages/visualizers/kmp-engine/kmp-engine.html',
    category: 'Sorting & Searching',
    icon: 'fa-search',
    desc: 'Interactive KMP Pattern Matching visualization.',
  },
  {
    name: 'State Space Bitmasking DP',
    path: '/pages/visualizers/bitmask-dp/bitmask-dp.html',
    category: 'Sorting & Searching',
    icon: 'fa-bullseye',
    desc: 'Interactive State Space Bitmasking DP visualization.',
  },
  {
    name: 'Dancing Links (DLX) Visualizer | Algo-Infinity-Verse',
    path: '/pages/visualizers/dancing-links/dancing-links.html',
    category: 'Special',
    icon: 'fa-star',
    desc: 'Interactive Dancing Links (DLX) Visualizer | Algo-Infinity-Verse visualization.',
  },
  {
    name: 'N-Queens Visualizer',
    path: '/pages/visualizers/n-queens-visualizer/n-queens-visualizer.html',
    category: 'Special',
    icon: 'fa-star',
    desc: 'Interactive visualizer for the N-Queens Backtracking algorithm.',
  },
  {
    name: 'Sudoku Solver Visualizer',
    path: '/pages/visualizers/sudoku-solver-visualizer/sudoku-solver-visualizer.html',
    category: 'Special',
    icon: 'fa-star',
    desc: 'Interactive visualizer for the Sudoku Solver Backtracking algorithm.',
  },
  {
    name: 'Dining Philosophers Simulator',
    path: '/pages/visualizers/dining-philosophers/dining-philosophers.html',
    category: 'Systems & OS',
    icon: 'fa-microchip',
    desc: 'Simulate the classic Dining Philosophers concurrency problem. Watch threads acquire locks and observe deadlocks.',
  },
  {
    name: 'HyperLogLog Estimator',
    path: '/pages/visualizers/hyperloglog-estimator/hyperloglog-estimator.html',
    category: 'Systems & OS',
    icon: 'fa-calculator',
    desc: 'Estimate billions of unique items using kilobytes of memory. Watch registers update live, see the harmonic mean estimate converge, and compare memory against an exact hash set.',
  },
  {
    name: 'LFU Cache Engine',
    path: '/pages/visualizers/lfu-cache/lfu-cache.html',
    category: 'Systems & OS',
    icon: 'fa-microchip',
    desc: 'Interactive LFU Cache Engine visualization.',
  },
  {
    name: 'LRU Cache Engine',
    path: '/pages/visualizers/lru-cache/lru-cache.html',
    category: 'Systems & OS',
    icon: 'fa-microchip',
    desc: 'Interactive LRU Cache Engine visualization.',
  },
  {
    name: 'Memcached Visualizer',
    path: '/pages/visualizers/memcached-visualizer/memcached-visualizer.html',
    category: 'Systems & OS',
    icon: 'fa-microchip',
    desc: 'Interactive Memcached Visualizer visualization.',
  },
  {
    name: 'Work-Stealing Scheduler Visualizer',
    path: '/pages/visualizers/work-stealing-scheduler/work-stealing-scheduler.html',
    category: 'Systems & OS',
    icon: 'fa-microchip',
    desc: 'See how Go',
  },
  {
    name: 'Algo Infinity Verse | Wavelet Tree Visualizer',
    path: '/pages/visualizers/wavelet-tree/wavelet-tree.html',
    category: 'Trees & BSTs',
    icon: 'fa-tree',
    desc: 'Interactive Algo Infinity Verse | Wavelet Tree Visualizer visualization.',
  },
  {
    name: 'AVL Tree Rotations Engine',
    path: '/pages/visualizers/avl-tree/avl-tree.html',
    category: 'Trees & BSTs',
    icon: 'fa-tree',
    desc: 'Interactive AVL Tree Rotations Engine visualization.',
  },
  {
    name: 'B+ Tree Database Engine',
    path: '/pages/visualizers/bplus-tree/bplus-tree.html',
    category: 'Trees & BSTs',
    icon: 'fa-tree',
    desc: 'Interactive B+ Tree Database Engine visualization.',
  },
  {
    name: 'Euler Tour Tree Visualizer · Algo Infinity Verse',
    path: '/pages/visualizers/ett/ett.html',
    category: 'Trees & BSTs',
    icon: 'fa-tree',
    desc: 'Interactive Euler Tour Tree Visualizer · Algo Infinity Verse visualization.',
  },
  {
    name: 'Fenwick Tree (BIT)',
    path: '/pages/visualizers/fenwick-tree/fenwick-tree.html',
    category: 'Trees & BSTs',
    icon: 'fa-tree',
    desc: 'Interactive Fenwick Tree (BIT) visualization.',
  },
  {
    name: 'Merkle Tree Visualizer',
    path: '/pages/visualizers/merkle-tree-visualizer/merkle-tree-visualizer.html',
    category: 'Trees & BSTs',
    icon: 'fa-tree',
    desc: 'Watch a Merkle tree propagate a single-bit change all the way to the root, and verify any leaf using only O(log n) sibling hashes instead of downloading everything.',
  },
  {
    name: 'Sliding Window · Algo Infinity Verse',
    path: '/pages/visualizers/sliding-window/sliding-window.html',
    category: 'Trees & BSTs',
    icon: 'fa-shapes',
    desc: 'An interactive Dual-Pointer State Machine visualizer for the Minimum Window Substring problem — watch the window expand, validate, and contract with a live frequency-map dashboard.',
  },
  {
    name: 'Succinct Bit Vector Explorer',
    path: '/pages/visualizers/succinct-bitvector-explorer/succinct-bitvector-explorer.html',
    category: 'Trees & BSTs',
    icon: 'fa-tree',
    desc: 'See how rank/select queries run in O(1) using superblock and block decomposition with only o(n) auxiliary bits — the structure behind FM-index genome search.',
  },
  {
    name: 'Treap Visualizer · Algo Infinity Verse',
    path: '/pages/visualizers/treap/treap.html',
    category: 'Trees & BSTs',
    icon: 'fa-tree',
    desc: 'Interactive Treap Visualizer · Algo Infinity Verse visualization.',
  },
  {
    name: 'Trie (Prefix Tree) Engine',
    path: '/pages/visualizers/trie-engine/trie-engine.html',
    category: 'Trees & BSTs',
    icon: 'fa-tree',
    desc: 'Interactive Trie (Prefix Tree) Engine visualization.',
  },
  {
    name: 'Van Emde Boas Tree Explorer',
    path: '/pages/visualizers/veb-tree-explorer/veb-tree-explorer.html',
    category: 'Trees & BSTs',
    icon: 'fa-tree',
    desc: 'Interactive Van Emde Boas tree for a 16-element universe — insert, delete, and find successors in O(log log U), beating any comparison-based tree for integer keys.',
  },
  {
    name: 'Word Search II (Trie + DFS) Visualizer | Algo-Infinity-Verse',
    path: '/pages/visualizers/word-search-ii-trie/word-search-ii-trie.html',
    category: 'Trees & BSTs',
    icon: 'fa-tree',
    desc: 'Interactive Word Search II (Trie + DFS) Visualizer | Algo-Infinity-Verse visualization.',
  },
  {
    name: 'Zobrist Hashing Playground',
    path: '/pages/visualizers/zobrist-hashing-playground/zobrist-hashing-playground.html',
    category: 'Trees & BSTs',
    icon: 'fa-tree',
    desc: 'See how chess engines hash board positions in O(1) per move using XOR — incremental updates, undo via self-inverse XOR, and transposition detection.',
  },
];

/* ─── Categories ─── */
const categories = [
  'All',
  'Sorting & Searching',
  'Trees & BSTs',
  'Graph Algorithms',
  'Dynamic Programming',
  'Systems & OS',
  'CPU Scheduling',
  'Distributed Systems',
  'Security & Crypto',
  'Math & Geometry',
  'AI & ML',
  'Data Structures',
  'Special',
];

/* ─── Category pastel colors ─── */
const categoryColors = {
  'sorting-searching': '#ffb3ba',
  'trees-bsts': '#baffc9',
  'graph-algorithms': '#bae1ff',
  'dynamic-programming': '#d4baff',
  'systems-os': '#ffd4ba',
  'cpu-scheduling': '#ffb3d9',
  'distributed-systems': '#baffdb',
  'security-crypto': '#ffbaba',
  'math-geometry': '#fdffb3',
  'ai-ml': '#c9baff',
  'data-structures': '#baf2ff',
  special: '#e6baff',
};

/* ─── DOM refs ─── */
const grid = document.getElementById('vizGrid');
const searchInput = document.getElementById('vizSearchInput');
const clearBtn = document.getElementById('vizClearBtn');
const filterContainer = document.getElementById('vizFilters');
const emptyState = document.getElementById('vizEmpty');
const countDisplay = document.getElementById('vizCountDisplay');

let activeCategory =
  new URLSearchParams(window.location.search).get('category') ||
  localStorage.getItem('vizFilterCategory') ||
  'all';
let searchQuery = '';
const pageReferrer = document.referrer;

/* ─── Build filter chips ─── */
function buildFilters() {
  categories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'viz-filter-chip' + (cat === 'All' ? ' active' : '');
    btn.dataset.category = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', cat === 'All' ? 'true' : 'false');
    btn.textContent =
      cat + (cat !== 'All' ? ` (${visualizers.filter((v) => v.category === cat).length})` : '');
    btn.addEventListener('click', () => {
      filterContainer.querySelectorAll('.viz-filter-chip').forEach((c) => {
        c.classList.remove('active');
        c.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      activeCategory = btn.dataset.category;
      localStorage.setItem('vizFilterCategory', activeCategory);
      const url = new URL(window.location);
      if (activeCategory === 'all') {
        url.searchParams.delete('category');
      } else {
        url.searchParams.set('category', activeCategory);
      }
      history.pushState({}, '', url);
      render();
    });
    filterContainer.appendChild(btn);
  });
}

/* ─── Render cards ─── */
function render() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const filtered = visualizers.filter((v) => {
    const matchCategory =
      activeCategory === 'all' ||
      v.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      v.name.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q) ||
      v.desc.toLowerCase().includes(q);
    return matchCategory && matchSearch;
  });

  countDisplay.textContent = filtered.length;

  if (filtered.length === 0) {
    grid.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  grid.innerHTML = filtered
    .map(
      (v, i) => `
    <a href="${v.path}" target="_blank" rel="noopener noreferrer" class="viz-card" role="listitem" style="animation-delay:${reducedMotion ? '0s' : Math.min(i * 0.025, 0.8)}s">
      <span class="viz-card-icon" style="color:${categoryColors[v.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')] || 'var(--viz-cyan)'}"><i class="fas ${v.icon}"></i></span>
      <span class="viz-card-title">${escHtml(v.name)}</span>
      <span class="viz-card-desc">${escHtml(v.desc)}</span>
      <div class="viz-card-footer">
        <span class="viz-card-category">${escHtml(v.category)}</span>
        <span class="viz-card-arrow"><i class="fas fa-arrow-right"></i></span>
      </div>
    </a>
  `
    )
    .join('');
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* ─── Search ─── */
searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value;
  clearBtn.classList.toggle('visible', searchQuery.length > 0);
  render();
});

clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchQuery = '';
  clearBtn.classList.remove('visible');
  render();
  searchInput.focus();
});

/* ─── Keyboard shortcut: ⌘K / Ctrl+K ─── */
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    searchInput.focus();
  }
  if (e.key === 'Escape') {
    searchInput.blur();
  }
});

/* ─── Back button ─── */
document.getElementById('vizBackBtn')?.addEventListener('click', () => {
  localStorage.removeItem('vizFilterCategory');
  if (pageReferrer && new URL(pageReferrer).origin === window.location.origin) {
    window.location.href = pageReferrer;
  } else if (window.history.length > 1) {
    history.back();
  } else {
    location.href = '/';
  }
});

/* ─── Init ─── */
buildFilters();

/* Restore active chip from URL */
function syncChipFromURL() {
  filterContainer.querySelectorAll('.viz-filter-chip').forEach((c) => {
    const isActive = c.dataset.category === activeCategory;
    c.classList.toggle('active', isActive);
    c.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}
syncChipFromURL();
render();

/* Handle browser back/forward */
window.addEventListener('popstate', () => {
  activeCategory =
    new URLSearchParams(window.location.search).get('category') ||
    localStorage.getItem('vizFilterCategory') ||
    'all';
  syncChipFromURL();
  render();
});
