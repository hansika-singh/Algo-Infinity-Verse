document.addEventListener('DOMContentLoaded', () => {

  const STORAGE_KEY = 'cache-learning-progress';
  let completedTopics = [];
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    completedTopics = raw.filter(id => !isNaN(id) && id !== null && id !== undefined && id !== "");
    if (raw.length !== completedTopics.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completedTopics));
    }
  } catch {
    completedTopics = [];
  }

  const topicsData = [
    {
      id: "1",
      title: "Introduction & Eviction Policies",
      icon: "📖",
      content: `<p>Caching is a core technique in computer systems to speed up data retrieval by storing copies of frequently accessed data in faster, albeit smaller and more expensive, memory (like RAM). Since cache capacity is finite, when the cache is full and new data needs to be loaded, the system must decide which existing item to discard. This process is called <strong>cache eviction</strong>.</p>
                <div class="api-concept-card">
                  <h4>Eviction Policy Comparison</h4>
                  <ul>
                    <li><strong>First-In, First-Out (FIFO)</strong> — Evicts the oldest item based on when it was added, regardless of how often or recently it was accessed. Simple but sub-optimal.</li>
                    <li><strong>Least Recently Used (LRU)</strong> — Evicts the item that has not been accessed for the longest time. Highly effective for temporal locality.</li>
                    <li><strong>Least Frequently Used (LFU)</strong> — Evicts the item with the lowest access count. Perfect for access frequency patterns, but can retain stale items that were heavily accessed in the past.</li>
                  </ul>
                </div>
                <div class="api-callout">
                  <span class="api-callout-icon">💡</span>
                  <p><strong>Complexity Constraints:</strong> To be useful in high-throughput database and networking layers, eviction policies must run operations (lookups, insertions, deletions) in <strong>O(1) time complexity</strong>.</p>
                </div>`,
      challenge: {
        title: "Eviction Policy Classifier",
        instruction: "Solve the eviction outcomes for each cache strategy. Select which key is evicted under FIFO, LRU, and LFU operations.",
        html: `
          <div class="match-container">
            <div class="match-item-row">
              <div class="match-question">
                <strong>Scenario 1 (FIFO):</strong> A cache of capacity 3. Operations: <code>PUT A, PUT B, PUT C, GET A, PUT D</code>. Which key is evicted to make room for D?
              </div>
              <div class="match-select-wrapper">
                <select id="matchFIFO" class="api-select">
                  <option value="">Select Key...</option>
                  <option value="A">Key A</option>
                  <option value="B">Key B</option>
                  <option value="C">Key C</option>
                  <option value="D">Key D</option>
                </select>
              </div>
            </div>
            <div class="match-item-row">
              <div class="match-question">
                <strong>Scenario 2 (LRU):</strong> A cache of capacity 3. Operations: <code>PUT A, PUT B, PUT C, GET A, PUT D</code>. Which key is evicted to make room for D?
              </div>
              <div class="match-select-wrapper">
                <select id="matchLRU" class="api-select">
                  <option value="">Select Key...</option>
                  <option value="A">Key A</option>
                  <option value="B">Key B</option>
                  <option value="C">Key C</option>
                  <option value="D">Key D</option>
                </select>
              </div>
            </div>
            <div class="match-item-row">
              <div class="match-question">
                <strong>Scenario 3 (LFU):</strong> A cache of capacity 3. Operations: <code>PUT A, PUT B, PUT C, GET A, GET B, GET B, PUT D</code>. Which key is evicted to make room for D?
              </div>
              <div class="match-select-wrapper">
                <select id="matchLFU" class="api-select">
                  <option value="">Select Key...</option>
                  <option value="A">Key A</option>
                  <option value="B">Key B</option>
                  <option value="C">Key C</option>
                  <option value="D">Key D</option>
                </select>
              </div>
            </div>
          </div>
        `
      }
    },
    {
      id: "2",
      title: "LRU Cache Concept & Visual Simulator",
      icon: "🔄",
      content: `<p>The <strong>Least Recently Used (LRU)</strong> cache eviction algorithm discards the least recently accessed items first. This strategy assumes that data accessed recently is likely to be accessed again soon (temporal locality).</p>
                <div class="api-concept-card">
                  <h4>HashMap + Doubly Linked List (DLL) Architecture</h4>
                  <p>To achieve strict <strong>O(1)</strong> operations, we combine two data structures:</p>
                  <ul>
                    <li><strong>HashMap</strong> maps keys to Doubly Linked List nodes, enabling O(1) lookups.</li>
                    <li><strong>Doubly Linked List</strong> keeps track of access order. The most recently used (MRU) node is moved to the Head, and the least recently used (LRU) node remains at the Tail. Splicing and relocating nodes takes O(1) time.</li>
                  </ul>
                </div>
                <div class="api-callout">
                  <span class="api-callout-icon">⚡</span>
                  <p><strong>List Relocation:</strong> Whenever a key is accessed (via <code>get</code>) or updated/inserted (via <code>put</code>), its corresponding node is moved to the Head of the list, marking it as the most recently used.</p>
                </div>`,
      challenge: {
        title: "LRU Cache Simulator Challenge",
        instruction: "Perform operations such that key <code>2</code> is evicted, leaving key <code>4</code> at Head (MRU), key <code>1</code> next, and key <code>3</code> at Tail (LRU) in a 3-capacity cache. Hint: Put 1, Put 2, Put 3, Get 1, Put 4.",
        html: `
          <div class="cache-panel-grid">
            <div>
              <label class="api-label">LRU Cache DLL Visualizer (MRU → LRU)</label>
              <div class="dll-visualizer" id="lruDllVisualizer">
                <!-- DLL nodes will go here -->
              </div>
              
              <label class="api-label">HashMap Key Lookup</label>
              <table class="hashmap-table">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Value Pointer (DLL Node)</th>
                  </tr>
                </thead>
                <tbody id="lruHashMapBody">
                  <!-- HashMap keys will go here -->
                </tbody>
              </table>
            </div>
            <div>
              <div class="quiz-container" style="background: rgba(0,0,0,0.15); border: 1px solid var(--glass-border); padding: 15px; border-radius: 8px; margin-top:0;">
                <label class="api-label" style="color: var(--primary-light);">Interactive Operations</label>
                <div class="cache-ctrl-group">
                  <input type="number" id="lruKeyInput" class="api-input" placeholder="Key" style="width: 70px; margin-bottom: 0;">
                  <input type="number" id="lruValInput" class="api-input" placeholder="Value" style="width: 70px; margin-bottom: 0;">
                  <button id="btnLruPut" class="btn btn-primary" style="margin-top: 0; padding: 8px 12px; font-size: 0.8rem;"><i class="fas fa-plus"></i> PUT</button>
                </div>
                <div class="cache-ctrl-group">
                  <input type="number" id="lruGetKeyInput" class="api-input" placeholder="Key" style="width: 140px; margin-bottom: 0;">
                  <button id="btnLruGet" class="btn btn-secondary" style="margin-top: 0; padding: 8px 12px; font-size: 0.8rem;"><i class="fas fa-search"></i> GET</button>
                </div>
                <button id="btnLruReset" class="btn btn-secondary" style="width:100%; font-size:0.75rem; padding: 6px; margin-top:5px;">Reset Cache</button>
                
                <label class="api-label" style="margin-top:15px;">Operation Logs</label>
                <div class="cache-console" id="lruConsole">
                  <div class="console-line info">[System] LRU Cache Initialized. Capacity: 3.</div>
                </div>
              </div>
            </div>
          </div>
        `
      }
    },
    {
      id: "3",
      title: "Doubly Linked List Internals & Node Splicer",
      icon: "⛓️",
      content: `<p>Moving a node to the head of a Doubly Linked List in <strong>O(1)</strong> requires two operations: splicing the node out of its current position, and inserting it at the head. Splicing must update the pointers of its surrounding neighbors.</p>
                <div class="api-concept-card">
                  <h4>Removing a Node in O(1)</h4>
                  <p>Given a pointer to a node <code>curr</code> in the list, we bypass it by connecting its previous node directly to its next node:</p>
                  <pre><code class="language-javascript">curr.prev.next = curr.next;
curr.next.prev = curr.prev;</code></pre>
                  <p>This bypasses <code>curr</code>, effectively isolating it from the list. We can then insert it at the head or delete it.</p>
                </div>
                <div class="api-callout">
                  <span class="api-callout-icon">⚠️</span>
                  <p><strong>Sentinels:</strong> To avoid checking for null pointers when adding/removing nodes at the boundaries (Head or Tail), production cache systems use dummy <strong>Head</strong> and <strong>Tail</strong> sentinel nodes. The list is never empty, which removes edge-case conditional branches.</p>
                </div>`,
      challenge: {
        title: "DLL Node Splicer",
        instruction: "Complete the pointer re-linking operations to splice a node <code>curr</code> from the list, then click 'Run Checks' to validate the logic.",
        html: `
          <div class="challenge-grid">
            <div style="grid-column: span 2;">
              <label class="api-label">1. Set the next pointer of the preceding node to point to the succeeding node:</label>
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-family: monospace; font-size: 0.9rem;">curr.prev.next = </span>
                <select id="spliceNext" class="api-select" style="flex:1; margin-bottom: 0;">
                  <option value="">Select pointer...</option>
                  <option value="curr">curr</option>
                  <option value="curr.next">curr.next</option>
                  <option value="curr.prev">curr.prev</option>
                  <option value="null">null</option>
                </select>
              </div>
            </div>
            <div style="grid-column: span 2; margin-top: 15px;">
              <label class="api-label">2. Set the previous pointer of the succeeding node to point to the preceding node:</label>
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-family: monospace; font-size: 0.9rem;">curr.next.prev = </span>
                <select id="splicePrev" class="api-select" style="flex:1; margin-bottom: 0;">
                  <option value="">Select pointer...</option>
                  <option value="curr">curr</option>
                  <option value="curr.next">curr.next</option>
                  <option value="curr.prev">curr.prev</option>
                  <option value="null">null</option>
                </select>
              </div>
            </div>
          </div>
        `
      }
    },
    {
      id: "4",
      title: "Implementing LRU Cache in O(1)",
      icon: "💻",
      content: `<p>Let's compile our conceptual structures into a concrete class. The cache class will instantiate a HashMap and initialize dummy sentinels linked together.</p>
                <div class="api-concept-card">
                  <h4>LRU Operations Logic</h4>
                  <ul>
                    <li><strong>get(key):</strong> Look up key in map. If not found, return -1. Otherwise, get node, move it to Head, and return its value.</li>
                    <li><strong>put(key, value):</strong> Look up key in map. If found, update value and move to Head. If not found, create a new node, add to map, and insert at Head. If cache size exceeds capacity, evict the tail node (the node before Tail sentinel) from both the map and the DLL.</li>
                  </ul>
                </div>`,
      challenge: {
        title: "LRU Code Completion Checker",
        instruction: "Complete the missing cache implementation code statements by selecting the correct variables/methods from the dropdowns.",
        html: `
          <div class="api-terminal" style="font-size: 0.8rem; line-height: 1.4; padding: 15px;">
            <div style="margin-bottom:8px;"><span style="color:#f472b6;">class</span> <span style="color:#60a5fa;">LRUCache</span> {</div>
            <div style="margin-left: 20px;">
              <span style="color:#38bdf8;">get</span>(key) {
                <br>&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#f472b6;">if</span> (!<span style="color:#f472b6;">this</span>.map.has(key)) <span style="color:#f472b6;">return</span> -1;
                <br>&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#f472b6;">const</span> node = <span style="color:#f472b6;">this</span>.map.get(key);
                <br>&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#f472b6;">this</span>.
                <select id="lruCodeGet" class="api-select" style="display:inline-block; width:160px; padding:2px; height:auto; font-size:0.75rem; margin-bottom:0;">
                  <option value="">Select method...</option>
                  <option value="removeNode(node)">removeNode(node)</option>
                  <option value="moveToHead(node)">moveToHead(node)</option>
                  <option value="addNode(node)">addNode(node)</option>
                </select>;
                <br>&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#f472b6;">return</span> node.value;
              }
              <br><br>
              <span style="color:#38bdf8;">put</span>(key, value) {
                <br>&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#f472b6;">if</span> (<span style="color:#f472b6;">this</span>.map.has(key)) {
                <br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#f472b6;">const</span> node = <span style="color:#f472b6;">this</span>.map.get(key);
                <br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;node.value = value;
                <br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#f472b6;">this</span>.moveToHead(node);
                <br>&nbsp;&nbsp;&nbsp;&nbsp;} <span style="color:#f472b6;">else</span> {
                <br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#f472b6;">if</span> (<span style="color:#f472b6;">this</span>.map.size >= <span style="color:#f472b6;">this</span>.capacity) {
                <br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#f472b6;">const</span> lruNode = <span style="color:#f472b6;">this</span>.
                <select id="lruCodeEvictNode" class="api-select" style="display:inline-block; width:160px; padding:2px; height:auto; font-size:0.75rem; margin-bottom:0;">
                  <option value="">Select node...</option>
                  <option value="head.next">head.next</option>
                  <option value="tail.prev">tail.prev</option>
                  <option value="map.get(key)">map.get(key)</option>
                </select>;
                <br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#f472b6;">this</span>.map.delete(lruNode.key);
                <br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#f472b6;">this</span>.removeNode(lruNode);
                <br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}
                <br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#f472b6;">const</span> newNode = <span style="color:#f472b6;">new</span> Node(key, value);
                <br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#f472b6;">this</span>.map.set(key, newNode);
                <br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#f472b6;">this</span>.
                <select id="lruCodeAdd" class="api-select" style="display:inline-block; width:160px; padding:2px; height:auto; font-size:0.75rem; margin-bottom:0;">
                  <option value="">Select method...</option>
                  <option value="addNode(newNode)">addNode(newNode)</option>
                  <option value="moveToHead(newNode)">moveToHead(newNode)</option>
                  <option value="removeNode(newNode)">removeNode(newNode)</option>
                </select>;
                <br>&nbsp;&nbsp;&nbsp;&nbsp;}
              }
            </div>
            <div>}</div>
          </div>
        `
      }
    },
    {
      id: "5",
      title: "LFU Cache Concept & Bucket Configurator",
      icon: "📊",
      content: `<p>The <strong>Least Frequently Used (LFU)</strong> cache eviction algorithm discards the item with the lowest access frequency count first. If there is a tie, the least recently used (LRU) item among them is evicted.</p>
                <div class="api-concept-card">
                  <h4>LFU Cache Architecture</h4>
                  <p>A simple frequency counter with sorting takes O(log N) time, which violates the O(1) requirement. To achieve O(1) complexity, we use:</p>
                  <ul>
                    <li><strong>Key Map:</strong> Maps keys to nodes (contains key, value, frequency count).</li>
                    <li><strong>Frequency Map:</strong> Maps each frequency (1, 2, 3...) to a separate Doubly Linked List containing all nodes of that frequency.</li>
                    <li><strong>minFrequency:</strong> An integer tracking the current lowest frequency list containing at least one node, indicating where to evict from when capacity is reached.</li>
                  </ul>
                </div>`,
      challenge: {
        title: "LFU Eviction Logic Configurator",
        instruction: "Solve the eviction query below based on LFU tie-breaking logic. Determine which key is evicted when the cache is full.",
        html: `
          <div class="challenge-grid">
            <div style="grid-column: span 2;">
              <label class="api-label">Given an LFU cache of Capacity = 3, with the following sequence of accesses:</label>
              <div class="api-terminal" style="padding: 10px; font-size: 0.8rem; font-family: monospace; line-height: 1.4;">
                PUT A (val: 10) <span style="color: #8b949e;">// A freq = 1</span>
                <br>PUT B (val: 20) <span style="color: #8b949e;">// B freq = 1</span>
                <br>PUT C (val: 30) <span style="color: #8b949e;">// C freq = 1</span>
                <br>GET A           <span style="color: #8b949e;">// A freq = 2</span>
                <br>GET B           <span style="color: #8b949e;">// B freq = 2</span>
                <br>PUT D (val: 40) <span style="color: #8b949e;">// Cache is FULL! Eviction occurs.</span>
              </div>
              <label class="api-label" style="margin-top: 15px;">Which key will be evicted to make room for D?</label>
              <select id="lfuEvictionSelect" class="api-select">
                <option value="">Select Key...</option>
                <option value="A">Key A (Frequency: 2, accessed most recently)</option>
                <option value="B">Key B (Frequency: 2, accessed recently)</option>
                <option value="C">Key C (Frequency: 1, accessed least recently)</option>
                <option value="none">No eviction occurs</option>
              </select>
            </div>
          </div>
        `
      }
    },
    {
      id: "6",
      title: "Implementing LFU Cache & Visual Simulator",
      icon: "🚀",
      content: `<p>Implementing LFU in O(1) requires shifting nodes between frequency lists. When a node is accessed, its frequency increments from $F$ to $F+1$. We must remove the node from the Doubly Linked List for frequency $F$, and insert it at the Head of the list for frequency $F+1$. If frequency $F$ list is now empty and $F$ was the <code>minFrequency</code>, we increment <code>minFrequency</code> to $F+1$.</p>
                <div class="api-callout">
                  <span class="api-callout-icon">💡</span>
                  <p><strong>Eviction Strategy:</strong> When capacity is exceeded, we find the Doubly Linked List corresponding to <code>minFrequency</code>, retrieve its tail node (LRU node of that frequency), remove it from the list, delete it from the Key Map, and insert our new node with frequency 1.</p>
                </div>`,
      challenge: {
        title: "LFU Cache Simulator Challenge",
        instruction: "Interact with the live LFU Cache Simulator. Capacity is set to 2. Perform operations: <code>PUT(1, 10), PUT(2, 20), GET(1), PUT(3, 30)</code>. This sequence will trigger an eviction of key 2 since key 1 has frequency 2 and key 2 has frequency 1.",
        html: `
          <div class="cache-panel-grid">
            <div>
              <label class="api-label">LFU Frequency Buckets & DLLs (Freq → DLL Nodes)</label>
              <div class="lfu-frequency-lists" id="lfuBucketsVisualizer">
                <!-- JS will render frequency rows here -->
              </div>
              
              <label class="api-label">HashMap Key Lookup</label>
              <table class="hashmap-table">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Frequency</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody id="lfuHashMapBody">
                  <!-- JS will populate here -->
                </tbody>
              </table>
            </div>
            <div>
              <div class="quiz-container" style="background: rgba(0,0,0,0.15); border: 1px solid var(--glass-border); padding: 15px; border-radius: 8px; margin-top: 0;">
                <label class="api-label" style="color: var(--primary-light);">Interactive Operations</label>
                <div class="cache-ctrl-group">
                  <input type="number" id="lfuKeyInput" class="api-input" placeholder="Key" style="width: 70px; margin-bottom: 0;">
                  <input type="number" id="lfuValInput" class="api-input" placeholder="Value" style="width: 70px; margin-bottom: 0;">
                  <button id="btnLfuPut" class="btn btn-primary" style="margin-top: 0; padding: 8px 12px; font-size: 0.8rem;"><i class="fas fa-plus"></i> PUT</button>
                </div>
                <div class="cache-ctrl-group">
                  <input type="number" id="lfuGetKeyInput" class="api-input" placeholder="Key" style="width: 140px; margin-bottom: 0;">
                  <button id="btnLfuGet" class="btn btn-secondary" style="margin-top: 0; padding: 8px 12px; font-size: 0.8rem;"><i class="fas fa-search"></i> GET</button>
                </div>
                <button id="btnLfuReset" class="btn btn-secondary" style="width:100%; font-size:0.75rem; padding: 6px; margin-top:5px;">Reset Cache</button>
                
                <label class="api-label" style="margin-top:15px;">Operation Logs</label>
                <div class="cache-console" id="lfuConsole">
                  <div class="console-line info">[System] LFU Cache Initialized. Capacity: 2.</div>
                </div>
              </div>
            </div>
          </div>
        `
      }
    },
    {
      id: "7",
      title: "Caching Patterns & System Design",
      icon: "⭐",
      content: `<p>In real-world system architecture, a cache does not live in isolation. You must design how the cache interacts with the database (caching patterns) and how it handles concurrency.</p>
                <div class="api-concept-card">
                  <h4>Caching Read/Write Strategies</h4>
                  <ul>
                    <li><strong>Cache-Aside (Lazy Loading):</strong> Client queries cache. If miss, queries database, updates cache, and returns. Simple, but cache can become stale.</li>
                    <li><strong>Write-Through:</strong> Cache is updated first, and cache synchronously updates the database. Ensures data consistency but adds write latency.</li>
                    <li><strong>Write-Back (Write-Behind):</strong> Cache is updated first, and database is updated asynchronously in batches. Extremely fast writes, but data can be lost if cache crashes before writing.</li>
                  </ul>
                </div>
                <div class="api-callout">
                  <span class="api-callout-icon">💡</span>
                  <p><strong>Concurrency & Safety:</strong> In multi-threaded environments, cache operations must use locking mechanisms (mutexes, read-write locks) to prevent race conditions. To avoid <strong>Cache Stampede</strong> (where multiple threads query DB simultaneously on cache expiration), developers implement locks or compute values before expiration.</p>
                </div>`,
      challenge: {
        title: "System Design Strategy Builder",
        instruction: "Match each production scenario with the optimal caching pattern or resolution strategy.",
        html: `
          <div class="match-container">
            <div class="match-item-row">
              <div class="match-question">
                <strong>1. Financial ledger system:</strong> Requires absolute consistency between Cache and Database, write latency is acceptable.
              </div>
              <div class="match-select-wrapper">
                <select id="sysDesignQ1" class="api-select">
                  <option value="">Select Strategy...</option>
                  <option value="aside">Cache-Aside</option>
                  <option value="through">Write-Through</option>
                  <option value="back">Write-Back</option>
                </select>
              </div>
            </div>
            <div class="match-item-row">
              <div class="match-question">
                <strong>2. High-speed logging/analytics:</strong> Requires sub-millisecond writes, and rare minor data loss during database outages is acceptable.
              </div>
              <div class="match-select-wrapper">
                <select id="sysDesignQ2" class="api-select">
                  <option value="">Select Strategy...</option>
                  <option value="aside">Cache-Aside</option>
                  <option value="through">Write-Through</option>
                  <option value="back">Write-Back</option>
                </select>
              </div>
            </div>
            <div class="match-item-row">
              <div class="match-question">
                <strong>3. Preventing Cache Stampede:</strong> A highly popular celebrity profile expires from cache, prompting 10,000 queries to hit the database at once.
              </div>
              <div class="match-select-wrapper">
                <select id="sysDesignQ3" class="api-select">
                  <option value="">Select Strategy...</option>
                  <option value="lock">Mutex / Mutual Exclusion Lock (Single-Flight)</option>
                  <option value="ttl">Shorten the TTL</option>
                  <option value="bypass">Bypass the cache completely</option>
                </select>
              </div>
            </div>
          </div>
        `
      }
    }
  ];

  const mainContent = document.getElementById('mainContent');
  const progressFill = document.getElementById('progressFill');
  const progressPercent = document.getElementById('progressPercent');
  const progressCount = document.getElementById('progressCount');
  const topicNavList = document.getElementById('topicNav');

  function updateGlobalProgress() {
    const total = topicsData.length;
    const completed = completedTopics.length;
    const percentage = Math.round((completed / total) * 100);

    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressPercent) progressPercent.textContent = `${percentage}%`;
    if (progressCount) progressCount.textContent = completed;

    // Trigger sidebar complete ticks update
    document.querySelectorAll('.api-sidebar-nav a').forEach(link => {
      const id = link.getAttribute('data-topic-id');
      if (completedTopics.includes(id)) {
        link.classList.add('completed-nav-item');
      } else {
        link.classList.remove('completed-nav-item');
      }
    });
  }

  function renderHub() {
    let html = `<div class="api-lesson-header">
                  <h3>Cache Systems Hub</h3>
                </div>
                <p>Select a topic below to begin learning. You must complete the interactive challenge in each section to mark it as completed!</p>
                <div class="api-hub-grid">`;
    
    topicsData.forEach(topic => {
      const isCompleted = completedTopics.includes(topic.id);
      html += `
        <div class="api-hub-card ${isCompleted ? 'completed' : ''}" data-id="${topic.id}">
          <div class="api-hub-card-icon">${topic.icon}</div>
          <div class="api-hub-card-title">${topic.title}</div>
        </div>
      `;
    });
    html += `</div>`;
    
    mainContent.innerHTML = html;

    document.querySelectorAll('.api-hub-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        renderTopic(id);
      });
    });

    updateActiveNav('hub');
  }

  function renderTopic(id) {
    const topic = topicsData.find(t => t.id === id);
    if (!topic) return;

    const isCompleted = completedTopics.includes(id);

    let html = `
      <article class="api-lesson">
        <div class="api-lesson-header">
          <span class="api-lesson-number">${id.padStart(2, '0')}</span>
          <h3>${topic.title}</h3>
        </div>
        ${topic.content}

        <div class="quiz-container">
          <h4 style="margin-bottom:5px; color:var(--primary-light);">Interactive Workspace</h4>
          <p style="font-size:0.9rem; margin-bottom:15px; color:var(--text-primary); font-weight:500;">
            ${topic.challenge.instruction}
          </p>
          <div id="challengeWorkspace">
            ${topic.challenge.html}
          </div>
          
          <div id="feedbackContainer" style="margin-top: 15px; display:none; padding:12px; border-radius:6px; font-size:0.85rem; line-height:1.5;"></div>

          <div style="display:flex; gap:10px; margin-top:20px;">
            <button id="checkBtn" class="btn btn-secondary" style="flex:1;">Run Checks</button>
            <button id="completeBtn" class="btn btn-primary complete-topic-btn" disabled style="flex:1.2; margin-top:0;">Mark as Completed</button>
          </div>
        </div>
      </article>
    `;

    mainContent.innerHTML = html;

    // Smooth Scroll to #cache-learning container
    const section = document.getElementById('cache-learning');
    if (section) {
      const yOffset = -85;
      const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }

    updateActiveNav(id);

    const completeBtn = document.getElementById('completeBtn');
    const checkBtn = document.getElementById('checkBtn');
    const feedback = document.getElementById('feedbackContainer');

    if (isCompleted) {
      completeBtn.textContent = "Topic Completed - Back to Hub";
      completeBtn.disabled = false;
      completeBtn.classList.replace('btn-primary', 'btn-secondary');
      checkBtn.style.display = 'none';
      
      feedback.style.display = 'block';
      feedback.style.background = 'rgba(76,175,80,0.1)';
      feedback.style.border = '1px solid #4CAF50';
      feedback.style.color = '#4CAF50';
      feedback.style.fontWeight = '500';
      feedback.innerHTML = "✓ You have successfully completed this interactive workspace challenge!";
      
      // Still set up listeners to show the visuals in solved state
      setupChallengeListeners(id, checkBtn, completeBtn, feedback, true);
    } else {
      setupChallengeListeners(id, checkBtn, completeBtn, feedback, false);
    }

    completeBtn.addEventListener('click', () => {
      if (!isCompleted) {
        completedTopics.push(id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(completedTopics));
        updateGlobalProgress();
      }
      renderHub();
    });
  }

  function setupChallengeListeners(topicId, checkBtn, completeBtn, feedback, isCompleted) {
    if (topicId === "1") {
      checkBtn.addEventListener('click', () => {
        const fifo = document.getElementById('matchFIFO').value;
        const lru = document.getElementById('matchLRU').value;
        const lfu = document.getElementById('matchLFU').value;

        const fifoOk = fifo === 'A';
        const lruOk = lru === 'B';
        const lfuOk = lfu === 'C';

        if (fifoOk && lruOk && lfuOk) {
          showSuccess(feedback, completeBtn, "Pass! You correctly classified the eviction targets. FIFO evicted Key A (oldest entry), LRU evicted Key B (least recently accessed), and LFU evicted Key C (lowest frequency count).");
        } else {
          let msg = "Validation failed: ";
          if (!fifoOk) msg += "FIFO should evict the oldest inserted key (A). ";
          if (!lruOk) msg += "LRU should evict the least recently accessed key (B, since A was accessed/refreshed by GET). ";
          if (!lfuOk) msg += "LFU should evict the key with the absolute lowest access frequency count (C, which was only accessed 1 time during creation, while A has 2 and B has 3). ";
          showError(feedback, msg);
        }
      });
    }

    else if (topicId === "2") {
      // LRU Simulator Implementation
      let cacheCapacity = 3;
      let cacheList = []; // Array of {key, value} representing DLL from Head (MRU) to Tail (LRU)
      const visualizer = document.getElementById('lruDllVisualizer');
      const hashBody = document.getElementById('lruHashMapBody');
      const consoleEl = document.getElementById('lruConsole');

      const logToConsole = (text, type = 'info') => {
        const line = document.createElement('div');
        line.className = `console-line ${type}`;
        line.textContent = `[LRU] ${text}`;
        consoleEl.appendChild(line);
        consoleEl.scrollTop = consoleEl.scrollHeight;
      };

      function updateLRUVisuals() {
        // Render DLL
        if (cacheList.length === 0) {
          visualizer.innerHTML = `<div class="dll-node sentinel">Head Sentinel</div>
                                  <div class="dll-arrow">←→</div>
                                  <div class="dll-node sentinel">Tail Sentinel</div>`;
        } else {
          let html = `<div class="dll-node sentinel">Head</div>`;
          cacheList.forEach(node => {
            html += `<div class="dll-arrow">←→</div>
                     <div class="dll-node" id="lru-node-${node.key}">
                       Key: ${node.key}<br>Val: ${node.value}
                     </div>`;
          });
          html += `<div class="dll-arrow">←→</div><div class="dll-node sentinel">Tail</div>`;
          visualizer.innerHTML = html;
        }

        // Render HashMap
        let hashHtml = '';
        if (cacheList.length === 0) {
          hashHtml = `<tr><td colspan="2" style="text-align:center; color:var(--text-secondary);">Map Empty</td></tr>`;
        } else {
          cacheList.forEach(node => {
            hashHtml += `<tr>
              <td class="hashmap-key">${node.key}</td>
              <td class="hashmap-val">Node(key=${node.key}, val=${node.value})</td>
            </tr>`;
          });
        }
        hashBody.innerHTML = hashHtml;

        // Check success criteria
        // Success criteria: Key 2 is evicted, 4 is MRU (index 0), 1 is next (index 1), 3 is LRU (index 2)
        if (!isCompleted) {
          const keys = cacheList.map(n => n.key);
          if (keys.length === 3 && keys[0] === 4 && keys[1] === 1 && keys[2] === 3) {
            showSuccess(feedback, completeBtn, "Success! You successfully simulated the required state. Key 2 was evicted (exceeded capacity), Key 4 is MRU (Head), and Key 3 is LRU (Tail).");
            logToConsole("State Verification Success! Challenge Cleared.", "success");
          }
        }
      }

      function lruPut(key, value) {
        // If key exists, update value and move to head
        const idx = cacheList.findIndex(n => n.key === key);
        if (idx !== -1) {
          logToConsole(`PUT(${key}, ${value}): Key exists. Updating value and shifting to MRU (Head).`, 'info');
          const node = cacheList.splice(idx, 1)[0];
          node.value = value;
          cacheList.unshift(node);
        } else {
          // Check capacity
          if (cacheList.length >= cacheCapacity) {
            const evicted = cacheList.pop();
            logToConsole(`PUT(${key}, ${value}): Cache FULL. Evicting LRU Node Key ${evicted.key} from Tail.`, 'warn');
            // Highlight evicted node briefly if possible
            const nodeEl = document.getElementById(`lru-node-${evicted.key}`);
            if (nodeEl) nodeEl.classList.add('evicted');
          }
          logToConsole(`PUT(${key}, ${value}): Inserting new Node at MRU (Head).`, 'success');
          cacheList.unshift({ key, value });
        }
        updateLRUVisuals();
      }

      function lruGet(key) {
        const idx = cacheList.findIndex(n => n.key === key);
        if (idx !== -1) {
          logToConsole(`GET(${key}): Hit! Shifting key ${key} to MRU (Head).`, 'success');
          const node = cacheList.splice(idx, 1)[0];
          cacheList.unshift(node);
          updateLRUVisuals();
          // Highlight node
          setTimeout(() => {
            const nodeEl = document.getElementById(`lru-node-${key}`);
            if (nodeEl) nodeEl.classList.add('highlight');
          }, 50);
          return node.value;
        } else {
          logToConsole(`GET(${key}): Cache Miss!`, 'danger');
          return -1;
        }
      }

      // Wire up buttons
      document.getElementById('btnLruPut').addEventListener('click', () => {
        const k = parseInt(document.getElementById('lruKeyInput').value);
        const v = parseInt(document.getElementById('lruValInput').value);
        if (isNaN(k) || isNaN(v)) {
          logToConsole("Error: Please specify valid integer Key and Value.", "danger");
          return;
        }
        lruPut(k, v);
      });

      document.getElementById('btnLruGet').addEventListener('click', () => {
        const k = parseInt(document.getElementById('lruGetKeyInput').value);
        if (isNaN(k)) {
          logToConsole("Error: Please specify valid integer Key.", "danger");
          return;
        }
        lruGet(k);
      });

      document.getElementById('btnLruReset').addEventListener('click', () => {
        cacheList = [];
        consoleEl.innerHTML = '';
        logToConsole("LRU Cache Initialized. Capacity: 3.", "info");
        updateLRUVisuals();
      });

      // Prepopulate list in solved state if already completed, or empty state
      if (isCompleted) {
        cacheList = [
          { key: 4, value: 40 },
          { key: 1, value: 10 },
          { key: 3, value: 30 }
        ];
      }
      updateLRUVisuals();

      checkBtn.addEventListener('click', () => {
        const keys = cacheList.map(n => n.key);
        if (keys.length === 3 && keys[0] === 4 && keys[1] === 1 && keys[2] === 3) {
          showSuccess(feedback, completeBtn, "Success! You simulated the correct cache evicted state.");
        } else {
          showError(feedback, "Incorrect state. Use operations to get the cache state: Head → [Key 4] → [Key 1] → [Key 3] → Tail. (Hint: PUT 1, PUT 2, PUT 3, GET 1, PUT 4).");
        }
      });
    }

    else if (topicId === "3") {
      checkBtn.addEventListener('click', () => {
        const nextPtr = document.getElementById('spliceNext').value;
        const prevPtr = document.getElementById('splicePrev').value;

        const nextOk = nextPtr === 'curr.next';
        const prevOk = prevPtr === 'curr.prev';

        if (nextOk && prevOk) {
          showSuccess(feedback, completeBtn, "Success! Pointers re-linked successfully. The neighbors have bypassed 'curr' in constant time O(1).");
        } else {
          let msg = "Validation failed: ";
          if (!nextOk) msg += "The next pointer of the previous node (curr.prev.next) must point forward to the succeeding node (curr.next). ";
          if (!prevOk) msg += "The previous pointer of the next node (curr.next.prev) must point backward to the preceding node (curr.prev). ";
          showError(feedback, msg);
        }
      });
    }

    else if (topicId === "4") {
      checkBtn.addEventListener('click', () => {
        const getSelect = document.getElementById('lruCodeGet').value;
        const evictSelect = document.getElementById('lruCodeEvictNode').value;
        const addSelect = document.getElementById('lruCodeAdd').value;

        const getOk = getSelect === 'moveToHead(node)';
        const evictOk = evictSelect === 'tail.prev';
        const addOk = addSelect === 'addNode(newNode)';

        if (getOk && evictOk && addOk) {
          showSuccess(feedback, completeBtn, "Pass! The LRU Cache implementation is functionally correct. Shifting accessed nodes to Head and evicting tail.prev guarantees correct LRU order.");
        } else {
          let msg = "Validation failed: ";
          if (!getOk) msg += "In get(key), we must shift the accessed node to Head to mark it as most recently used: 'moveToHead(node)'. ";
          if (!evictOk) msg += "When capacity is full, the least recently used node is immediately before Tail sentinel: 'tail.prev'. ";
          if (!addOk) msg += "For a new key, insert the node into the Doubly Linked List structure using 'addNode(newNode)'. ";
          showError(feedback, msg);
        }
      });
    }

    else if (topicId === "5") {
      checkBtn.addEventListener('click', () => {
        const eviction = document.getElementById('lfuEvictionSelect').value;
        if (eviction === 'C') {
          showSuccess(feedback, completeBtn, "Success! Key C is evicted. While A and B have frequency counts of 2, Key C has a frequency count of 1. LFU evicts the absolute lowest frequency first.");
        } else {
          showError(feedback, "Incorrect. Key C is evicted because its access frequency count (1 PUT) is lower than A and B (1 PUT + 1 GET).");
        }
      });
    }

    else if (topicId === "6") {
      // LFU Simulator Implementation
      let cacheCapacity = 2;
      let minFrequency = 0;
      let keyMap = {}; // key -> {key, val, freq}
      let freqMap = {}; // freq -> array of keys (representing DLL order MRU to LRU)
      const visualizer = document.getElementById('lfuBucketsVisualizer');
      const hashBody = document.getElementById('lfuHashMapBody');
      const consoleEl = document.getElementById('lfuConsole');

      const logToConsole = (text, type = 'info') => {
        const line = document.createElement('div');
        line.className = `console-line ${type}`;
        line.textContent = `[LFU] ${text}`;
        consoleEl.appendChild(line);
        consoleEl.scrollTop = consoleEl.scrollHeight;
      };

      function updateLFUVisuals() {
        // Render Frequency buckets
        let bucketsHtml = '';
        const frequencies = Object.keys(freqMap).map(Number).sort((a,b) => b-a);
        if (frequencies.length === 0) {
          bucketsHtml = `<div style="text-align:center; color:var(--text-secondary); padding: 10px;">Buckets Empty</div>`;
        } else {
          frequencies.forEach(freq => {
            const list = freqMap[freq] || [];
            if (list.length > 0) {
              let rowHtml = `<div class="lfu-freq-row">
                <div class="lfu-freq-badge">Frequency ${freq}</div>
                <div class="lfu-dll-wrapper">
                  <div class="dll-list">`;
              list.forEach((key, index) => {
                const node = keyMap[key];
                if (index > 0) rowHtml += `<div class="dll-arrow">←→</div>`;
                rowHtml += `<div class="dll-node" id="lfu-node-${key}">
                  Key: ${key}<br>Val: ${node.val}
                  <span class="freq-indicator">${node.freq}</span>
                </div>`;
              });
              rowHtml += `</div></div></div>`;
              bucketsHtml += rowHtml;
            }
          });
        }
        visualizer.innerHTML = bucketsHtml;

        // Render HashMap table
        let hashHtml = '';
        const keys = Object.keys(keyMap);
        if (keys.length === 0) {
          hashHtml = `<tr><td colspan="3" style="text-align:center; color:var(--text-secondary);">Map Empty</td></tr>`;
        } else {
          keys.forEach(k => {
            const node = keyMap[k];
            hashHtml += `<tr>
              <td class="hashmap-key">${k}</td>
              <td class="hashmap-val">${node.freq}</td>
              <td class="hashmap-val">Node(val=${node.val})</td>
            </tr>`;
          });
        }
        hashBody.innerHTML = hashHtml;

        // Check verification scenario: PUT 1, PUT 2, GET 1, PUT 3.
        // Cache capacity 2. Key 2 should be evicted. Keys 1 and 3 remain, key 1 has freq 2, key 3 has freq 1.
        if (!isCompleted) {
          if (keyMap[1] && keyMap[3] && !keyMap[2] && keyMap[1].freq === 2 && keyMap[3].freq === 1) {
            showSuccess(feedback, completeBtn, "Success! You successfully simulated LFU eviction. Key 2 was evicted (lowest frequency count 1), Key 1 has frequency 2, and Key 3 has frequency 1.");
            logToConsole("State Verification Success! Challenge Cleared.", "success");
          }
        }
      }

      function updateFrequency(key) {
        const node = keyMap[key];
        const oldFreq = node.freq;
        node.freq++;
        
        // Remove key from old frequency list
        freqMap[oldFreq] = freqMap[oldFreq].filter(k => k !== key);
        
        // Add to new frequency list
        if (!freqMap[node.freq]) freqMap[node.freq] = [];
        freqMap[node.freq].unshift(key);

        // Update minFrequency if old frequency list is empty and it was the minFrequency
        if (oldFreq === minFrequency && freqMap[oldFreq].length === 0) {
          minFrequency++;
        }
      }

      function lfuPut(key, val) {
        if (keyMap[key]) {
          logToConsole(`PUT(${key}, ${val}): Key exists. Updating value and incrementing frequency.`, 'info');
          keyMap[key].val = val;
          updateFrequency(key);
        } else {
          // Check capacity
          if (Object.keys(keyMap).length >= cacheCapacity) {
            // Get LRU node of minFrequency list
            const minList = freqMap[minFrequency];
            const evictedKey = minList.pop(); // Pop LRU node from tail of list
            delete keyMap[evictedKey];
            logToConsole(`PUT(${key}, ${val}): Cache FULL. Evicting LFU Node Key ${evictedKey} (freq: ${minFrequency}) from Tail.`, 'warn');
          }
          logToConsole(`PUT(${key}, ${val}): Inserting new Node with Frequency 1.`, 'success');
          keyMap[key] = { key, val, freq: 1 };
          minFrequency = 1;
          if (!freqMap[1]) freqMap[1] = [];
          freqMap[1].unshift(key);
        }
        updateLFUVisuals();
      }

      function lfuGet(key) {
        if (keyMap[key]) {
          logToConsole(`GET(${key}): Hit! Shifting key ${key} frequency bucket.`, 'success');
          updateFrequency(key);
          updateLFUVisuals();
          setTimeout(() => {
            const nodeEl = document.getElementById(`lfu-node-${key}`);
            if (nodeEl) nodeEl.classList.add('highlight');
          }, 50);
          return keyMap[key].val;
        } else {
          logToConsole(`GET(${key}): Cache Miss!`, 'danger');
          return -1;
        }
      }

      document.getElementById('btnLfuPut').addEventListener('click', () => {
        const k = parseInt(document.getElementById('lfuKeyInput').value);
        const v = parseInt(document.getElementById('lfuValInput').value);
        if (isNaN(k) || isNaN(v)) {
          logToConsole("Error: Specify valid integer Key and Value.", "danger");
          return;
        }
        lfuPut(k, v);
      });

      document.getElementById('btnLfuGet').addEventListener('click', () => {
        const k = parseInt(document.getElementById('lfuGetKeyInput').value);
        if (isNaN(k)) {
          logToConsole("Error: Specify valid integer Key.", "danger");
          return;
        }
        lfuGet(k);
      });

      document.getElementById('btnLfuReset').addEventListener('click', () => {
        keyMap = {};
        freqMap = {};
        minFrequency = 0;
        consoleEl.innerHTML = '';
        logToConsole("LFU Cache Initialized. Capacity: 2.", "info");
        updateLFUVisuals();
      });

      // Prepopulate
      if (isCompleted) {
        keyMap = {
          1: { key: 1, val: 10, freq: 2 },
          3: { key: 3, val: 30, freq: 1 }
        };
        freqMap = {
          2: [1],
          1: [3]
        };
        minFrequency = 1;
      }
      updateLFUVisuals();

      checkBtn.addEventListener('click', () => {
        if (keyMap[1] && keyMap[3] && !keyMap[2] && keyMap[1].freq === 2 && keyMap[3].freq === 1) {
          showSuccess(feedback, completeBtn, "Success! You simulated the correct LFU evicted state.");
        } else {
          showError(feedback, "Incorrect state. Capacity is 2. Run: PUT(1, 10), PUT(2, 20), GET(1), PUT(3, 30) to trigger eviction of Key 2.");
        }
      });
    }

    else if (topicId === "7") {
      checkBtn.addEventListener('click', () => {
        const q1 = document.getElementById('sysDesignQ1').value;
        const q2 = document.getElementById('sysDesignQ2').value;
        const q3 = document.getElementById('sysDesignQ3').value;

        const q1Ok = q1 === 'through';
        const q2Ok = q2 === 'back';
        const q3Ok = q3 === 'lock';

        if (q1Ok && q2Ok && q3Ok) {
          showSuccess(feedback, completeBtn, "Contract Validated! Write-Through guarantees write parity for financial systems. Write-Back provides maximum database scaling for logging. Mutex locks prevent thundering herds on expire events.");
        } else {
          let msg = "Validation failed: ";
          if (!q1Ok) msg += "1: Financial systems require zero-loss database write guarantees; use Write-Through. ";
          if (!q2Ok) msg += "2: Sub-millisecond logging and bulk loading benefits from asynchronous batching; use Write-Back. ";
          if (!q3Ok) msg += "3: To block concurrent stampede calls, serializing queries via single-flight Mutex lock is the industry standard. ";
          showError(feedback, msg);
        }
      });
    }
  }

  function showSuccess(feedbackEl, completeBtn, message) {
    feedbackEl.style.display = 'block';
    feedbackEl.style.background = 'rgba(76,175,80,0.1)';
    feedbackEl.style.border = '1px solid #4CAF50';
    feedbackEl.style.color = '#4CAF50';
    feedbackEl.innerHTML = `<strong>Success!</strong> ${message}`;
    completeBtn.disabled = false;
  }

  function showError(feedbackEl, message) {
    feedbackEl.style.display = 'block';
    feedbackEl.style.background = 'rgba(244,67,54,0.1)';
    feedbackEl.style.border = '1px solid #f44336';
    feedbackEl.style.color = '#f44336';
    feedbackEl.innerHTML = `<strong>Error:</strong> ${message}`;
  }

  function updateActiveNav(id) {
    document.querySelectorAll('.api-nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-topic-id') === id) {
        link.classList.add('active');
      }
    });
  }

  // Bind Sidebar Navigation
  document.querySelectorAll('.api-nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = link.getAttribute('data-topic-id');
      if (id === 'hub') renderHub();
      else renderTopic(id);
    });
  });

  /* 1. HERO TYPING ANIMATION */
  const words = ['LRU Cache', 'LFU Cache', 'O(1) HashMaps', 'Doubly Linked Lists', 'System Design', 'Cache Eviction', 'Interview Prep'];
  const typingElement = document.getElementById('typingTextCache');
  if (typingElement) {
    let wordIndex = 0; let charIndex = 0; let deleting = false; let timeoutId = null;
    function typeEffect() {
      const currentWord = words[wordIndex];
      if (deleting) {
        typingElement.textContent = currentWord.substring(0, charIndex - 1);
        charIndex--;
      } else {
        typingElement.textContent = currentWord.substring(0, charIndex + 1);
        charIndex++;
      }
      let speed = deleting ? 50 : 100;
      if (!deleting && charIndex === currentWord.length) { speed = 1800; deleting = true; }
      if (deleting && charIndex === 0) { deleting = false; wordIndex = (wordIndex + 1) % words.length; speed = 400; }
      timeoutId = setTimeout(typeEffect, speed);
    }
    typeEffect();
    window.addEventListener('beforeunload', () => clearTimeout(timeoutId));
  }

  /* 2. STATS COUNTER ANIMATION */
  const counters = document.querySelectorAll('.stat-number[data-target]');
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const counter = entry.target;
      if (counter.dataset.counted) return;
      counter.dataset.counted = 'true';
      const target = parseInt(counter.dataset.target, 10);
      let current = 0;
      const increment = Math.ceil(target / 40);
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) { current = target; clearInterval(timer); }
        counter.textContent = current;
      }, 30);
      counterObserver.unobserve(counter);
    });
  }, { threshold: 0.5 });
  counters.forEach(counter => counterObserver.observe(counter));

  // Bind Hero Stats Click Navigation
  const statBoxTopics = document.getElementById('statBoxTopics');
  const statBoxSims = document.getElementById('statBoxSims');
  const statBoxInterviews = document.getElementById('statBoxInterviews');

  if (statBoxTopics) {
    statBoxTopics.addEventListener('click', () => {
      renderHub();
      const section = document.getElementById('cache-learning');
      if (section) {
        const yOffset = -85;
        const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  }

  if (statBoxSims) {
    statBoxSims.addEventListener('click', () => {
      renderTopic("2"); // Redirect to LRU visual simulator
    });
  }

  if (statBoxInterviews) {
    statBoxInterviews.addEventListener('click', () => {
      renderTopic("7"); // Redirect to System Design caching prep
    });
  }

  // Initialize
  updateGlobalProgress();
  renderHub();

});
