/* ============================================
   VISUALIZERS — Data, Search & Filter
   ============================================ */

const visualizers = [
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
    name: 'Binary Search Visualizer',
    path: '/pages/learning/binary-search/binary-search.html',
    category: 'Sorting & Searching',
    icon: 'fa-crosshairs',
    desc: 'Interactive binary search with divide-and-conquer visualization.',
  },
  {
    name: 'Fast/Slow Pointer Simulator',
    path: '/pages/visualizers/fast-slow-pointer-simulator/fast-slow-pointer-simulator.html',
    category: 'Sorting & Searching',
    icon: 'fa-arrows-left-right',
    desc: "Visualize Floyd's cycle detection algorithm with fast and slow pointers.",
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
    name: 'QUIC & HTTP/3 Simulator',
    path: '/pages/visualizers/quic-simulator/quic-simulator.html',
    category: 'Systems & OS',
    icon: 'fa-network-wired',
    desc: "Interactive simulator comparing TCP/TLS handshakes against QUIC's 0-RTT.",
  },
  {
    name: 'Git Visualizer',
    path: '/pages/ai-features/git-visualizer/git-visualizer.html',
    category: 'Systems & OS',
    icon: 'fa-code-branch',
    desc: 'Visualize Git internals: commits, branches, merges, and the DAG commit graph.',
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
    <a href="${v.path}" class="viz-card" role="listitem" style="animation-delay:${reducedMotion ? '0s' : Math.min(i * 0.025, 0.8)}s">
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
