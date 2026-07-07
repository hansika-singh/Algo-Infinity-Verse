// script.js handles: loading screen, navbar, dark mode, scroll top
// This file handles ONLY: app cards, modal, topics grid

document.addEventListener('DOMContentLoaded', function() {
  eaRenderApps();
  eaRenderTopics();
  eaInitModal();
});

/* ─── App Data ─── */
let EA_APPS = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    cardClass: 'ea-card-instagram',
    tagline: 'Social graph, feed ranking & recommendations',
    dsaTags: ['Graphs', 'Heaps', 'Hash Maps', 'PageRank'],
    concepts: 4,
    diagram: eaDiagramInstagram,
    flow: [
      { icon: '👤', name: 'User Action', dsa: 'Event Queue' },
      { icon: '🔗', name: 'Social Graph', dsa: 'Graph (BFS)' },
      { icon: '📊', name: 'Feed Ranking', dsa: 'Max-Heap' },
      { icon: '🤖', name: 'Recommender', dsa: 'Similarity Graph' },
      { icon: '📱', name: 'Feed Display', dsa: 'Linked List' },
    ],
    dsaTable: [
      { concept: 'Graph (BFS/DFS)', feature: 'Social graph traversal', why: 'Find friends-of-friends, mutual connections, suggested follows' },
      { concept: 'Max-Heap',        feature: 'Feed ranking',           why: 'Top posts bubble up by engagement score — O(log n) insert' },
      { concept: 'HashMap',         feature: 'Like/follow storage',    why: 'O(1) lookup: "Did user X already like post Y?"' },
      { concept: 'PageRank',        feature: 'Explore page ranking',   why: 'Accounts ranked by weighted graph centrality, like Google Search' },
    ],
    insight: 'Instagram\'s feed was originally chronological (a sorted linked list). After switching to ranked feeds, they use a multi-factor score heap — processing 500 million daily active users\' interactions in real time.',
    learnLinks: [
      { label: 'Learn Graphs', href: '/graph-learning.html' },
      { label: 'Learn Heaps', href: '/heaps-learning.html' },
      { label: 'Learn BFS/DFS', href: '/graph-visualizer.html' },
    ]
  },
  {
    id: 'googlemaps',
    name: 'Google Maps',
    icon: '🗺️',
    cardClass: 'ea-card-googlemaps',
    tagline: 'Shortest path, routing & real-time traffic',
    dsaTags: ["Dijkstra's", 'A* Search', 'Graphs', 'Priority Queue'],
    concepts: 4,
    diagram: eaDiagramMaps,
    flow: [
      { icon: '📍', name: 'Origin/Dest', dsa: 'GPS Coords' },
      { icon: '🕸️', name: 'Road Graph', dsa: 'Weighted Graph' },
      { icon: '⚡', name: 'Pathfinding', dsa: "Dijkstra's + A*" },
      { icon: '🚦', name: 'Traffic Layer', dsa: 'Priority Queue' },
      { icon: '🛣️', name: 'Route Display', dsa: 'Path Array' },
    ],
    dsaTable: [
      { concept: "Dijkstra's Algorithm", feature: 'Shortest route',       why: 'Finds minimum-weight path in weighted road graph — O((V+E) log V)' },
      { concept: 'A* Search',            feature: 'Faster routing',        why: 'Heuristic guides search toward destination — far faster than Dijkstra on large maps' },
      { concept: 'Priority Queue',        feature: 'Traffic-aware routing', why: 'Roads with congestion get higher edge weights; queue always expands cheapest next step' },
      { concept: 'Graph (adjacency list)',feature: 'Road network model',    why: 'Every intersection = node, every road segment = weighted edge' },
    ],
    insight: 'Google Maps stores the road network of Earth as a graph with ~billions of nodes. Pure Dijkstra\'s would be too slow — they use A* with heuristics, contraction hierarchies, and precomputed landmarks to route in milliseconds.',
    learnLinks: [
      { label: 'Learn Shortest Path', href: '/shortest-path-learning.html' },
      { label: 'Pathfinding Visualizer', href: '/pathfinding-visualizer.html' },
      { label: 'Learn Graphs', href: '/graph-learning.html' },
    ]
  },
  {
    id: 'spotify',
    name: 'Spotify',
    icon: '🎵',
    cardClass: 'ea-card-spotify',
    tagline: 'Recommendation engines, similarity graphs & queues',
    dsaTags: ['Similarity Graph', 'Priority Queue', 'Collaborative Filtering', 'Heaps'],
    concepts: 4,
    diagram: eaDiagramSpotify,
    flow: [
      { icon: '🎧', name: 'Listening History', dsa: 'Array / Stream' },
      { icon: '🔢', name: 'Song Vectors', dsa: 'Feature Vectors' },
      { icon: '🕸️', name: 'Similarity Graph', dsa: 'Weighted Graph' },
      { icon: '🏆', name: 'Top Picks', dsa: 'Max-Heap' },
      { icon: '🎶', name: 'Playlist', dsa: 'Priority Queue' },
    ],
    dsaTable: [
      { concept: 'Weighted Graph',         feature: 'Song similarity network', why: 'Songs are nodes; edge weight = audio feature similarity (BPM, key, energy)' },
      { concept: 'Collaborative Filtering',feature: 'Discover Weekly',         why: 'Matrix factorization finds latent patterns across millions of user-song interactions' },
      { concept: 'Max-Heap',               feature: 'Top recommendation picks',why: 'Efficiently extract top-K similar songs without sorting all candidates' },
      { concept: 'Priority Queue',          feature: 'Playback queue',          why: 'User-defined priority order + auto-recommendations merged in real time' },
    ],
    insight: '"Discover Weekly" analyzes 30 seconds of audio per song, extracts 200+ features, builds a graph of 100M+ songs, and finds your personalized cluster — every Monday. It\'s collaborative filtering + graph traversal at planetary scale.',
    learnLinks: [
      { label: 'Learn Graphs', href: '/graph-learning.html' },
      { label: 'Learn Heaps', href: '/heaps-learning.html' },
      { label: 'Graph Visualizer', href: '/graph-visualizer.html' },
    ]
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: '💬',
    cardClass: 'ea-card-whatsapp',
    tagline: 'Message queues, delivery systems & encryption',
    dsaTags: ['Queues', 'Hash Maps', 'Trees (Huffman)', 'End-to-End Encryption'],
    concepts: 4,
    diagram: eaDiagramWhatsApp,
    flow: [
      { icon: '✍️', name: 'Message Send', dsa: 'Enqueue' },
      { icon: '📦', name: 'Message Queue', dsa: 'FIFO Queue' },
      { icon: '🔐', name: 'Encryption', dsa: 'Huffman / RSA Tree' },
      { icon: '📡', name: 'Delivery', dsa: 'Routing Graph' },
      { icon: '✅', name: 'Delivered', dsa: 'ACK + HashMap' },
    ],
    dsaTable: [
      { concept: 'Queue (FIFO)',      feature: 'Message delivery',    why: 'Messages delivered in order sent — classic FIFO queue ensures ordering guarantees' },
      { concept: 'HashMap',           feature: 'Online status lookup', why: 'O(1) check: "Is user X currently online?" across 2 billion users' },
      { concept: 'Huffman Tree',      feature: 'Message compression',  why: 'Reduces message size before transmission — Huffman encoding = optimal prefix-free tree' },
      { concept: 'Graph (routing)',   feature: 'Server routing',       why: 'Message routed through server graph to find the recipient\'s connected server node' },
    ],
    insight: 'WhatsApp processes 100 billion messages per day. The secret: messages are stored in queues on servers, not delivered directly peer-to-peer. When your phone is offline, your messages wait in a persistent queue — exactly like the Queue ADT you\'ve studied.',
    learnLinks: [
      { label: 'Learn Queues', href: '/stack-queue-visualizer.html' },
      { label: 'Learn Trees', href: '/trees-learning.html' },
      { label: 'Learn Graphs', href: '/graph-learning.html' },
    ]
  },
  {
    id: 'netflix',
    name: 'Netflix',
    icon: '🎬',
    cardClass: 'ea-card-netflix',
    tagline: 'LRU caching, recommendation algorithms & CDN',
    dsaTags: ['LRU Cache', 'HashMap + DLL', 'Recommendation Graph', 'Binary Search'],
    concepts: 4,
    diagram: eaDiagramNetflix,
    flow: [
      { icon: '🔍', name: 'Content Request', dsa: 'HashMap Lookup' },
      { icon: '💾', name: 'LRU Cache', dsa: 'HashMap + DLL' },
      { icon: '🌐', name: 'CDN Node', dsa: 'Graph (nearest)' },
      { icon: '🤖', name: 'Recommender', dsa: 'Collab. Filtering' },
      { icon: '📺', name: 'Stream', dsa: 'Buffer Queue' },
    ],
    dsaTable: [
      { concept: 'LRU Cache (HashMap + DLL)', feature: 'Instant content load',    why: 'Most-recently-watched content cached; O(1) get and put via HashMap + Doubly Linked List' },
      { concept: 'Collaborative Filtering',   feature: 'Recommendations',          why: '"Users like you also watched" — matrix factorization on billions of watch events' },
      { concept: 'Graph (CDN routing)',        feature: 'Low-latency streaming',    why: 'Nearest CDN node found via shortest-path graph traversal from user location' },
      { concept: 'Binary Search',             feature: 'Content catalog search',   why: 'Sorted content index queried with binary search for O(log n) title lookup' },
    ],
    insight: 'The LRU Cache is one of the most famous interview problems because Netflix actually uses it. Their Open Connect CDN caches the top 1,000 titles locally at each ISP — the cache eviction policy is LRU, implemented as a HashMap + Doubly Linked List.',
    learnLinks: [
      { label: 'Learn Heaps', href: '/heaps-learning.html' },
      { label: 'Learn Binary Search', href: '/binary-search.html' },
      { label: 'Learn Graphs', href: '/graph-learning.html' },
    ]
  },
  {
    id: 'amazon',
    name: 'Amazon',
    icon: '📦',
    cardClass: 'ea-card-amazon',
    tagline: 'Heaps, search ranking, inventory & logistics',
    dsaTags: ['Heaps', 'Trie (Search)', 'Priority Queue', 'Graph (Logistics)'],
    concepts: 4,
    diagram: eaDiagramAmazon,
    flow: [
      { icon: '🔎', name: 'Search Query', dsa: 'Trie Lookup' },
      { icon: '📊', name: 'Result Ranking', dsa: 'Max-Heap' },
      { icon: '🏪', name: 'Inventory Check', dsa: 'HashMap' },
      { icon: '🚚', name: 'Delivery Route', dsa: "Dijkstra's" },
      { icon: '📬', name: 'Dispatch Queue', dsa: 'Priority Queue' },
    ],
    dsaTable: [
      { concept: 'Trie',            feature: 'Search autocomplete',    why: 'O(L) prefix matching for autocomplete — L = query length, across millions of products' },
      { concept: 'Max-Heap',        feature: 'Product ranking',        why: 'Top-K results by relevance score extracted efficiently without sorting all products' },
      { concept: 'HashMap',         feature: 'Inventory management',   why: 'O(1) stock lookup per SKU — Amazon manages 350M+ product listings' },
      { concept: 'Graph + Dijkstra',feature: 'Delivery optimization',  why: 'Warehouse-to-door route as weighted graph; minimum-cost delivery path via shortest path algorithms' },
    ],
    insight: 'Amazon\'s "same-day delivery" relies on a Priority Queue of orders sorted by delivery SLA, a shortest-path algorithm routing each driver, and a Trie-backed search index that returns autocomplete results in under 100ms for 350M+ products.',
    learnLinks: [
      { label: 'Learn Heaps', href: '/heaps-learning.html' },
      { label: 'Learn Shortest Path', href: '/shortest-path-learning.html' },
      { label: 'Learn Trie & Strings', href: '/trie-string-learning.html' },
    ]
  }
];

/* ─── SVG Architecture Diagrams ─── */
function eaDiagramInstagram() {
  return '<svg viewBox="0 0 320 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<rect x="5" y="30" width="55" height="30" rx="6" fill="rgba(240,148,51,0.2)" stroke="rgba(240,148,51,0.5)" stroke-width="1"/>' +
    '<text x="32" y="49" text-anchor="middle" font-size="9" fill="#f09433" font-family="Poppins,sans-serif">Social Graph</text>' +
    '<line x1="60" y1="45" x2="75" y2="45" stroke="#a855f7" stroke-width="1.5" marker-end="url(#arr)"/>' +
    '<rect x="75" y="30" width="55" height="30" rx="6" fill="rgba(168,85,247,0.15)" stroke="rgba(168,85,247,0.4)" stroke-width="1"/>' +
    '<text x="102" y="49" text-anchor="middle" font-size="9" fill="#a855f7" font-family="Poppins,sans-serif">Feed Ranker</text>' +
    '<line x1="130" y1="45" x2="145" y2="45" stroke="#a855f7" stroke-width="1.5" marker-end="url(#arr)"/>' +
    '<rect x="145" y="30" width="55" height="30" rx="6" fill="rgba(220,39,67,0.15)" stroke="rgba(220,39,67,0.4)" stroke-width="1"/>' +
    '<text x="172" y="42" text-anchor="middle" font-size="9" fill="#ef4444" font-family="Poppins,sans-serif">Recommender</text>' +
    '<text x="172" y="53" text-anchor="middle" font-size="7" fill="#ef4444" font-family="Fira Code,monospace">Max-Heap</text>' +
    '<line x1="200" y1="45" x2="215" y2="45" stroke="#a855f7" stroke-width="1.5" marker-end="url(#arr)"/>' +
    '<rect x="215" y="30" width="55" height="30" rx="6" fill="rgba(6,182,212,0.12)" stroke="rgba(6,182,212,0.4)" stroke-width="1"/>' +
    '<text x="242" y="49" text-anchor="middle" font-size="9" fill="#06b6d4" font-family="Poppins,sans-serif">User Feed</text>' +
    '<defs><marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#a855f7"/></marker></defs>' +
    '</svg>';
}

function eaDiagramMaps() {
  return '<svg viewBox="0 0 320 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<circle cx="30" cy="45" r="18" fill="rgba(66,133,244,0.15)" stroke="rgba(66,133,244,0.5)" stroke-width="1"/>' +
    '<text x="30" y="42" text-anchor="middle" font-size="8" fill="#4285f4" font-family="Poppins,sans-serif">Road</text>' +
    '<text x="30" y="52" text-anchor="middle" font-size="8" fill="#4285f4" font-family="Poppins,sans-serif">Graph</text>' +
    '<line x1="48" y1="45" x2="70" y2="45" stroke="#4285f4" stroke-width="1.5" marker-end="url(#arr2)"/>' +
    '<rect x="70" y="28" width="70" height="34" rx="8" fill="rgba(52,168,83,0.15)" stroke="rgba(52,168,83,0.5)" stroke-width="1"/>' +
    '<text x="105" y="43" text-anchor="middle" font-size="9" fill="#34a853" font-family="Poppins,sans-serif">Dijkstra / A*</text>' +
    '<text x="105" y="54" text-anchor="middle" font-size="7" fill="#34a853" font-family="Fira Code,monospace">Priority Queue</text>' +
    '<line x1="140" y1="45" x2="162" y2="45" stroke="#4285f4" stroke-width="1.5" marker-end="url(#arr2)"/>' +
    '<rect x="162" y="28" width="60" height="34" rx="8" fill="rgba(251,188,5,0.12)" stroke="rgba(251,188,5,0.5)" stroke-width="1"/>' +
    '<text x="192" y="43" text-anchor="middle" font-size="9" fill="#fbbc05" font-family="Poppins,sans-serif">Traffic</text>' +
    '<text x="192" y="54" text-anchor="middle" font-size="7" fill="#fbbc05" font-family="Fira Code,monospace">Edge Weights</text>' +
    '<line x1="222" y1="45" x2="244" y2="45" stroke="#4285f4" stroke-width="1.5" marker-end="url(#arr2)"/>' +
    '<circle cx="268" cy="45" r="18" fill="rgba(234,67,53,0.15)" stroke="rgba(234,67,53,0.5)" stroke-width="1"/>' +
    '<text x="268" y="42" text-anchor="middle" font-size="8" fill="#ea4335" font-family="Poppins,sans-serif">Best</text>' +
    '<text x="268" y="52" text-anchor="middle" font-size="8" fill="#ea4335" font-family="Poppins,sans-serif">Route</text>' +
    '<defs><marker id="arr2" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#4285f4"/></marker></defs>' +
    '</svg>';
}

function eaDiagramSpotify() {
  return '<svg viewBox="0 0 320 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<rect x="5" y="28" width="60" height="34" rx="8" fill="rgba(29,185,84,0.12)" stroke="rgba(29,185,84,0.5)" stroke-width="1"/>' +
    '<text x="35" y="43" text-anchor="middle" font-size="9" fill="#1db954" font-family="Poppins,sans-serif">Listen</text>' +
    '<text x="35" y="54" text-anchor="middle" font-size="7" fill="#1db954" font-family="Fira Code,monospace">History</text>' +
    '<line x1="65" y1="45" x2="85" y2="45" stroke="#1db954" stroke-width="1.5" marker-end="url(#arr3)"/>' +
    '<rect x="85" y="28" width="65" height="34" rx="8" fill="rgba(29,185,84,0.1)" stroke="rgba(29,185,84,0.4)" stroke-width="1"/>' +
    '<text x="117" y="43" text-anchor="middle" font-size="9" fill="#1db954" font-family="Poppins,sans-serif">Similarity</text>' +
    '<text x="117" y="54" text-anchor="middle" font-size="7" fill="#1db954" font-family="Fira Code,monospace">Graph</text>' +
    '<line x1="150" y1="45" x2="170" y2="45" stroke="#1db954" stroke-width="1.5" marker-end="url(#arr3)"/>' +
    '<rect x="170" y="28" width="65" height="34" rx="8" fill="rgba(30,215,96,0.1)" stroke="rgba(30,215,96,0.4)" stroke-width="1"/>' +
    '<text x="202" y="43" text-anchor="middle" font-size="9" fill="#1ed760" font-family="Poppins,sans-serif">Top-K</text>' +
    '<text x="202" y="54" text-anchor="middle" font-size="7" fill="#1ed760" font-family="Fira Code,monospace">Max-Heap</text>' +
    '<line x1="235" y1="45" x2="255" y2="45" stroke="#1db954" stroke-width="1.5" marker-end="url(#arr3)"/>' +
    '<rect x="255" y="28" width="60" height="34" rx="8" fill="rgba(29,185,84,0.12)" stroke="rgba(29,185,84,0.5)" stroke-width="1"/>' +
    '<text x="285" y="43" text-anchor="middle" font-size="9" fill="#1db954" font-family="Poppins,sans-serif">Discover</text>' +
    '<text x="285" y="54" text-anchor="middle" font-size="7" fill="#1db954" font-family="Fira Code,monospace">Weekly</text>' +
    '<defs><marker id="arr3" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#1db954"/></marker></defs>' +
    '</svg>';
}

function eaDiagramWhatsApp() {
  return '<svg viewBox="0 0 320 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<rect x="5" y="28" width="55" height="34" rx="8" fill="rgba(37,211,102,0.12)" stroke="rgba(37,211,102,0.5)" stroke-width="1"/>' +
    '<text x="32" y="43" text-anchor="middle" font-size="9" fill="#25d366" font-family="Poppins,sans-serif">Sender</text>' +
    '<text x="32" y="54" text-anchor="middle" font-size="7" fill="#25d366" font-family="Fira Code,monospace">Enqueue</text>' +
    '<line x1="60" y1="45" x2="80" y2="45" stroke="#25d366" stroke-width="1.5" marker-end="url(#arr4)"/>' +
    '<rect x="80" y="28" width="75" height="34" rx="8" fill="rgba(18,140,126,0.12)" stroke="rgba(18,140,126,0.5)" stroke-width="1"/>' +
    '<text x="117" y="43" text-anchor="middle" font-size="9" fill="#128c7e" font-family="Poppins,sans-serif">Msg Queue</text>' +
    '<text x="117" y="54" text-anchor="middle" font-size="7" fill="#128c7e" font-family="Fira Code,monospace">FIFO</text>' +
    '<line x1="155" y1="45" x2="175" y2="45" stroke="#25d366" stroke-width="1.5" marker-end="url(#arr4)"/>' +
    '<rect x="175" y="28" width="65" height="34" rx="8" fill="rgba(37,211,102,0.1)" stroke="rgba(37,211,102,0.4)" stroke-width="1"/>' +
    '<text x="207" y="43" text-anchor="middle" font-size="9" fill="#25d366" font-family="Poppins,sans-serif">Encrypt</text>' +
    '<text x="207" y="54" text-anchor="middle" font-size="7" fill="#25d366" font-family="Fira Code,monospace">Huffman</text>' +
    '<line x1="240" y1="45" x2="260" y2="45" stroke="#25d366" stroke-width="1.5" marker-end="url(#arr4)"/>' +
    '<rect x="260" y="28" width="55" height="34" rx="8" fill="rgba(18,140,126,0.12)" stroke="rgba(18,140,126,0.5)" stroke-width="1"/>' +
    '<text x="287" y="43" text-anchor="middle" font-size="9" fill="#128c7e" font-family="Poppins,sans-serif">Receiver</text>' +
    '<text x="287" y="54" text-anchor="middle" font-size="7" fill="#128c7e" font-family="Fira Code,monospace">Dequeue</text>' +
    '<defs><marker id="arr4" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#25d366"/></marker></defs>' +
    '</svg>';
}

function eaDiagramNetflix() {
  return '<svg viewBox="0 0 320 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<rect x="5" y="28" width="60" height="34" rx="8" fill="rgba(229,9,20,0.12)" stroke="rgba(229,9,20,0.5)" stroke-width="1"/>' +
    '<text x="35" y="43" text-anchor="middle" font-size="9" fill="#e50914" font-family="Poppins,sans-serif">Request</text>' +
    '<text x="35" y="54" text-anchor="middle" font-size="7" fill="#e50914" font-family="Fira Code,monospace">HashMap</text>' +
    '<line x1="65" y1="45" x2="85" y2="45" stroke="#e50914" stroke-width="1.5" marker-end="url(#arr5)"/>' +
    '<rect x="85" y="25" width="75" height="40" rx="8" fill="rgba(229,9,20,0.1)" stroke="rgba(229,9,20,0.4)" stroke-width="1"/>' +
    '<text x="122" y="42" text-anchor="middle" font-size="9" fill="#e50914" font-family="Poppins,sans-serif">LRU Cache</text>' +
    '<text x="122" y="55" text-anchor="middle" font-size="7" fill="#e50914" font-family="Fira Code,monospace">HashMap+DLL</text>' +
    '<line x1="160" y1="45" x2="180" y2="45" stroke="#e50914" stroke-width="1.5" marker-end="url(#arr5)"/>' +
    '<rect x="180" y="28" width="60" height="34" rx="8" fill="rgba(178,7,16,0.12)" stroke="rgba(178,7,16,0.5)" stroke-width="1"/>' +
    '<text x="210" y="43" text-anchor="middle" font-size="9" fill="#b20710" font-family="Poppins,sans-serif">CDN Node</text>' +
    '<text x="210" y="54" text-anchor="middle" font-size="7" fill="#b20710" font-family="Fira Code,monospace">Graph</text>' +
    '<line x1="240" y1="45" x2="260" y2="45" stroke="#e50914" stroke-width="1.5" marker-end="url(#arr5)"/>' +
    '<rect x="260" y="28" width="55" height="34" rx="8" fill="rgba(229,9,20,0.12)" stroke="rgba(229,9,20,0.5)" stroke-width="1"/>' +
    '<text x="287" y="43" text-anchor="middle" font-size="9" fill="#e50914" font-family="Poppins,sans-serif">Stream</text>' +
    '<text x="287" y="54" text-anchor="middle" font-size="7" fill="#e50914" font-family="Fira Code,monospace">Buffer Q</text>' +
    '<defs><marker id="arr5" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#e50914"/></marker></defs>' +
    '</svg>';
}

function eaDiagramAmazon() {
  return '<svg viewBox="0 0 320 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<rect x="5" y="28" width="60" height="34" rx="8" fill="rgba(255,153,0,0.12)" stroke="rgba(255,153,0,0.5)" stroke-width="1"/>' +
    '<text x="35" y="43" text-anchor="middle" font-size="9" fill="#ff9900" font-family="Poppins,sans-serif">Search</text>' +
    '<text x="35" y="54" text-anchor="middle" font-size="7" fill="#ff9900" font-family="Fira Code,monospace">Trie</text>' +
    '<line x1="65" y1="45" x2="85" y2="45" stroke="#ff9900" stroke-width="1.5" marker-end="url(#arr6)"/>' +
    '<rect x="85" y="28" width="65" height="34" rx="8" fill="rgba(228,121,17,0.12)" stroke="rgba(228,121,17,0.5)" stroke-width="1"/>' +
    '<text x="117" y="43" text-anchor="middle" font-size="9" fill="#e47911" font-family="Poppins,sans-serif">Ranking</text>' +
    '<text x="117" y="54" text-anchor="middle" font-size="7" fill="#e47911" font-family="Fira Code,monospace">Max-Heap</text>' +
    '<line x1="150" y1="45" x2="170" y2="45" stroke="#ff9900" stroke-width="1.5" marker-end="url(#arr6)"/>' +
    '<rect x="170" y="28" width="65" height="34" rx="8" fill="rgba(255,153,0,0.1)" stroke="rgba(255,153,0,0.4)" stroke-width="1"/>' +
    '<text x="202" y="43" text-anchor="middle" font-size="9" fill="#ff9900" font-family="Poppins,sans-serif">Inventory</text>' +
    '<text x="202" y="54" text-anchor="middle" font-size="7" fill="#ff9900" font-family="Fira Code,monospace">HashMap</text>' +
    '<line x1="235" y1="45" x2="255" y2="45" stroke="#ff9900" stroke-width="1.5" marker-end="url(#arr6)"/>' +
    '<rect x="255" y="28" width="60" height="34" rx="8" fill="rgba(228,121,17,0.12)" stroke="rgba(228,121,17,0.5)" stroke-width="1"/>' +
    '<text x="285" y="43" text-anchor="middle" font-size="9" fill="#e47911" font-family="Poppins,sans-serif">Delivery</text>' +
    '<text x="285" y="54" text-anchor="middle" font-size="7" fill="#e47911" font-family="Fira Code,monospace">Dijkstra</text>' +
    '<defs><marker id="arr6" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#ff9900"/></marker></defs>' +
    '</svg>';
}

/* ─── Topics Data ─── */
let EA_TOPICS = [
  { name: 'Graphs (BFS/DFS)', icon: '🕸️', apps: ['Instagram', 'Google Maps', 'Spotify', 'WhatsApp'], link: '/graph-learning.html' },
  { name: "Dijkstra's / A*",  icon: '📍', apps: ['Google Maps', 'Amazon'],                           link: '/shortest-path-learning.html' },
  { name: 'Heaps / Max-Heap', icon: '🔥', apps: ['Instagram', 'Spotify', 'Amazon'],                  link: '/heaps-learning.html' },
  { name: 'Hash Maps (O(1))', icon: '⚡', apps: ['Instagram', 'WhatsApp', 'Netflix', 'Amazon'],       link: '/array-learning.html' },
  { name: 'Priority Queue',   icon: '📋', apps: ['Google Maps', 'Spotify', 'Amazon'],                 link: '/heaps-learning.html' },
  { name: 'LRU Cache',        icon: '💾', apps: ['Netflix'],                                          link: '/cache-learning.html' },
  { name: 'Queues (FIFO)',    icon: '📬', apps: ['WhatsApp', 'Netflix'],                              link: '/stack-queue-visualizer.html' },
  { name: 'Trie',             icon: '🔤', apps: ['Amazon'],                                           link: '/trie-string-learning.html' },
  { name: 'Collab. Filtering',icon: '🤖', apps: ['Spotify', 'Netflix'],                               link: '/graph-learning.html' },
];

/* ─── Render App Cards ─── */
function eaRenderApps() {
  let grid = document.getElementById('eaAppsGrid');
  if (!grid) return;

  grid.innerHTML = EA_APPS.map(function(app) {
    let tagsHtml = app.dsaTags.map(function(t) {
      return '<span class="ea-dsa-tag">' + t + '</span>';
    }).join('');

    return '<div class="ea-app-card ' + app.cardClass + '" tabindex="0" role="button" ' +
           'aria-label="Explore ' + app.name + '" data-app="' + app.id + '">' +
      '<div class="ea-card-header">' +
        '<span class="ea-app-icon">' + app.icon + '</span>' +
        '<div>' +
          '<div class="ea-app-name">' + app.name + '</div>' +
          '<div class="ea-app-tagline">' + app.tagline + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="ea-arch-diagram">' + app.diagram() + '</div>' +
      '<div class="ea-dsa-tags">' + tagsHtml + '</div>' +
      '<div class="ea-card-footer">' +
        '<span class="ea-card-explore"><i class="fas fa-arrow-right"></i> Explore Architecture</span>' +
        '<span class="ea-card-concept-count">' + app.concepts + ' DSA concepts</span>' +
      '</div>' +
    '</div>';
  }).join('');

  grid.querySelectorAll('.ea-app-card').forEach(function(card) {
    let open = function() {
      let id = card.getAttribute('data-app');
      eaOpenModal(id);
    };
    card.addEventListener('click', open);
    card.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });
}

/* ─── Render Topics ─── */
function eaRenderTopics() {
  let grid = document.getElementById('eaTopicsGrid');
  if (!grid) return;

  grid.innerHTML = EA_TOPICS.map(function(t) {
    let appBadges = t.apps.map(function(a) {
      return '<span class="ea-topic-app-badge">' + a + '</span>';
    }).join('');

    return '<div class="ea-topic-card">' +
      '<div class="ea-topic-name">' + t.icon + ' ' + t.name + '</div>' +
      '<div class="ea-topic-apps">' + appBadges + '</div>' +
      '<a href="' + t.link + '" class="ea-topic-learn-link"><i class="fas fa-book-open"></i> Learn this topic</a>' +
    '</div>';
  }).join('');
}

/* ─── Modal ─── */
function eaInitModal() {
  let modal   = document.getElementById('eaModal');
  let closeBtn = document.getElementById('eaModalClose');
  if (!modal || !closeBtn) return;

  closeBtn.addEventListener('click', function() {
    modal.classList.remove('active');
  });
  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.classList.remove('active');
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') modal.classList.remove('active');
  });
}

function eaOpenModal(id) {
  let app = null;
  for (let i = 0; i < EA_APPS.length; i++) {
    if (EA_APPS[i].id === id) { app = EA_APPS[i]; break; }
  }
  if (!app) return;

  let modal   = document.getElementById('eaModal');
  let titleEl = document.getElementById('eaModalTitle');
  let iconEl  = document.getElementById('eaModalIcon');
  let bodyEl  = document.getElementById('eaModalBody');
  if (!modal || !titleEl || !iconEl || !bodyEl) return;

  titleEl.textContent = app.name;
  iconEl.textContent  = app.icon;

  // Build flow HTML
  let flowHtml = '<div class="ea-section-title"><i class="fas fa-sitemap"></i> Architecture Flow</div>';
  flowHtml += '<div class="ea-flow">';
  app.flow.forEach(function(step, idx) {
    flowHtml += '<div class="ea-flow-step">' +
      '<span class="ea-flow-step-icon">' + step.icon + '</span>' +
      '<span class="ea-flow-step-name">' + step.name + '</span>' +
      '<span class="ea-flow-step-dsa">' + step.dsa + '</span>' +
    '</div>';
    if (idx < app.flow.length - 1) {
      flowHtml += '<span class="ea-flow-arrow"><i class="fas fa-arrow-right"></i></span>';
    }
  });
  flowHtml += '</div>';

  // DSA table
  let tableHtml = '<div class="ea-section-title"><i class="fas fa-table"></i> DSA Concepts Used</div>';
  tableHtml += '<table class="ea-dsa-table"><thead><tr>' +
    '<th>DSA Concept</th><th>Feature</th><th>Why It Fits</th>' +
    '</tr></thead><tbody>';
  app.dsaTable.forEach(function(row) {
    tableHtml += '<tr><td>' + row.concept + '</td><td>' + row.feature + '</td><td>' + row.why + '</td></tr>';
  });
  tableHtml += '</tbody></table>';

  // Insight
  let insightHtml = '<div class="ea-section-title"><i class="fas fa-lightbulb"></i> Real-World Insight</div>' +
    '<div class="ea-insight"><span class="ea-insight-icon">💡</span><span>' + app.insight + '</span></div>';

  // Learn more
  let learnHtml = '<div class="ea-section-title"><i class="fas fa-book-open"></i> Learn These Topics</div>' +
    '<div class="ea-learn-links">';
  app.learnLinks.forEach(function(l) {
    learnHtml += '<a href="' + l.href + '" class="ea-learn-link"><i class="fas fa-arrow-right"></i>' + l.label + '</a>';
  });
  learnHtml += '</div>';

  bodyEl.innerHTML = flowHtml + tableHtml + insightHtml + learnHtml;
  modal.classList.add('active');
}