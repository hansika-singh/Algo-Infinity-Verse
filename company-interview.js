document.addEventListener("DOMContentLoaded", () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  initDarkMode();
  initCIQ();
});

function initLoadingScreen() {
  setTimeout(() => {
    const s = document.getElementById("loading-screen");
    if (s) s.classList.add("hidden");
  }, 1500);
}

function initScrollTop() {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;
  window.addEventListener("scroll", () => btn.classList.toggle("visible", window.scrollY > 400));
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function initDarkMode() {
  const toggle = document.getElementById("darkModeToggle");
  if (!toggle) return;
  const icon = toggle.querySelector("i");
  if (localStorage.getItem("darkMode") === "light") {
    document.body.classList.add("light-mode");
    icon.classList.replace("fa-moon", "fa-sun");
  }
  toggle.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    const isLight = document.body.classList.contains("light-mode");
    icon.classList.toggle("fa-moon", !isLight);
    icon.classList.toggle("fa-sun", isLight);
    localStorage.setItem("darkMode", isLight ? "light" : "dark");
  });
}

function initNavbar() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");
  if (!menuToggle || !navLinks) return;
  let overlay = document.querySelector(".nav-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "nav-overlay";
    document.body.appendChild(overlay);
  }
  const toggleMenu = (open) => {
    const isOpen = open !== undefined ? open : !navLinks.classList.contains("active");
    navLinks.classList.toggle("active", isOpen);
    menuToggle.setAttribute("aria-expanded", isOpen);
    overlay.classList.toggle("active", isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
    const icon = menuToggle.querySelector("i");
    if (icon) { icon.classList.toggle("fa-bars", !isOpen); icon.classList.toggle("fa-times", isOpen); }
  };
  menuToggle.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(); });
  overlay.addEventListener("click", () => toggleMenu(false));
  navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => toggleMenu(false)));
  const isMobile = () => window.matchMedia("(max-width: 1024px)").matches;
  document.querySelectorAll(".dropdown-toggle").forEach((toggle) => {
    const parent = toggle.closest(".has-dropdown");
    const menu = parent?.querySelector(".dropdown-menu");
    if (!parent || !menu) return;
    let t;
    parent.addEventListener("mouseenter", () => { if (!isMobile()) { clearTimeout(t); parent.classList.add("open"); toggle.setAttribute("aria-expanded", "true"); } });
    parent.addEventListener("mouseleave", () => { if (!isMobile()) { t = setTimeout(() => { parent.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }, 250); } });
    toggle.addEventListener("click", (e) => { if (isMobile()) { e.preventDefault(); e.stopPropagation(); const o = parent.classList.toggle("open"); toggle.setAttribute("aria-expanded", o); } });
  });
  window.addEventListener("scroll", () => {
    const nav = document.querySelector(".navbar");
    if (nav) nav.style.background = window.scrollY > 100 ? "rgba(10,10,26,0.95)" : "rgba(10,10,26,0.85)";
  });
}

/* ─── Question Data ─── */
const QUESTIONS = [
  // Amazon
  { id: 1,  company: "Amazon",    role: "SDE",           diff: "medium", title: "Two Sum",                               topic: "Arrays",          hint: "Use a hash map for O(n) solution. For each number, check if target - num exists in the map.",        lp: "Customer Obsession" },
  { id: 2,  company: "Amazon",    role: "SDE",           diff: "hard",   title: "LRU Cache",                             topic: "Design",          hint: "Combine a HashMap with a Doubly Linked List for O(1) get and put operations.",                      lp: "Invent and Simplify" },
  { id: 3,  company: "Amazon",    role: "Backend",       diff: "medium", title: "Design a Rate Limiter",                 topic: "System Design",   hint: "Consider Token Bucket or Sliding Window algorithm. Think about distributed scenarios.",             lp: "Deliver Results" },
  { id: 4,  company: "Amazon",    role: "SDE",           diff: "easy",   title: "Valid Parentheses",                     topic: "Stack",           hint: "Use a stack. Push opening brackets, pop and match on closing brackets.",                           lp: "Customer Obsession" },
  { id: 5,  company: "Amazon",    role: "SDE",           diff: "hard",   title: "Merge K Sorted Lists",                  topic: "Heap",            hint: "Use a min-heap of size K. Always extract the minimum and push the next element from that list.",    lp: "Think Big" },
  { id: 6,  company: "Amazon",    role: "Data Engineer", diff: "medium", title: "Top K Frequent Elements",               topic: "Heap",            hint: "Use a frequency map, then a min-heap of size K.",                                                  lp: "Deliver Results" },
  { id: 7,  company: "Amazon",    role: "Backend",       diff: "hard",   title: "Design Amazon Warehouse System",        topic: "System Design",   hint: "Think about inventory sharding, write-ahead logs, and eventual consistency for distributed stock.",  lp: "Dive Deep" },
  { id: 8,  company: "Amazon",    role: "SDE",           diff: "medium", title: "Number of Islands",                     topic: "Graphs",          hint: "BFS or DFS — mark visited cells. Count connected components of '1's.",                            lp: "Invent and Simplify" },

  // Google
  { id: 9,  company: "Google",    role: "SDE",           diff: "hard",   title: "Word Ladder",                           topic: "BFS",             hint: "Model as BFS on a graph. Each word is a node, edges exist when words differ by one letter.",        lp: "" },
  { id: 10, company: "Google",    role: "SDE",           diff: "medium", title: "Group Anagrams",                        topic: "HashMap",         hint: "Sort each word as the key, group all words with the same sorted key.",                             lp: "" },
  { id: 11, company: "Google",    role: "Frontend",      diff: "medium", title: "Implement a Virtual DOM Diff Algorithm", topic: "Trees",           hint: "Recursively compare old and new trees. Track insertions, deletions, and updates.",                  lp: "" },
  { id: 12, company: "Google",    role: "SDE",           diff: "hard",   title: "Median of Two Sorted Arrays",           topic: "Binary Search",   hint: "Binary search on the smaller array partition. O(log(min(m,n))) solution.",                         lp: "" },
  { id: 13, company: "Google",    role: "Data Engineer", diff: "hard",   title: "Design Google Search Autocomplete",     topic: "System Design",   hint: "Use a Trie with frequency scores. Cache top-K suggestions per prefix.",                           lp: "" },
  { id: 14, company: "Google",    role: "SDE",           diff: "easy",   title: "Climbing Stairs",                       topic: "DP",              hint: "Classic Fibonacci DP. dp[n] = dp[n-1] + dp[n-2].",                                                lp: "" },
  { id: 15, company: "Google",    role: "Backend",       diff: "medium", title: "Design a URL Shortener",                topic: "System Design",   hint: "Use base62 encoding on an auto-increment ID. Think about redirection, analytics, expiry.",          lp: "" },
  { id: 16, company: "Google",    role: "SDE",           diff: "medium", title: "Course Schedule",                       topic: "Graphs",          hint: "Topological sort or cycle detection using DFS with a visited/in-stack array.",                      lp: "" },

  // Microsoft
  { id: 17, company: "Microsoft", role: "SDE",           diff: "easy",   title: "Reverse Linked List",                   topic: "Linked List",     hint: "Three pointers: prev, curr, next. Iterate and reverse links one by one.",                          lp: "" },
  { id: 18, company: "Microsoft", role: "SDE",           diff: "medium", title: "Longest Substring Without Repeating Characters", topic: "Sliding Window", hint: "Sliding window with a HashSet. Expand right, shrink left on duplicates.",                  lp: "" },
  { id: 19, company: "Microsoft", role: "Frontend",      diff: "medium", title: "Implement Promise.all()",               topic: "JavaScript",      hint: "Track resolved count. Reject immediately on any failure. Resolve when all complete.",              lp: "" },
  { id: 20, company: "Microsoft", role: "SDE",           diff: "hard",   title: "Serialize and Deserialize Binary Tree", topic: "Trees",           hint: "BFS level-order serialization. Use 'null' markers for missing nodes.",                            lp: "" },
  { id: 21, company: "Microsoft", role: "Backend",       diff: "hard",   title: "Design Distributed File Storage",       topic: "System Design",   hint: "Think chunking, replication factor, metadata server, consistent hashing for chunk servers.",       lp: "" },
  { id: 22, company: "Microsoft", role: "Data Engineer", diff: "medium", title: "Find All Duplicates in an Array",       topic: "Arrays",          hint: "Mark visited indices negative. If arr[abs(val)-1] is already negative, it's a duplicate.",        lp: "" },
  { id: 23, company: "Microsoft", role: "SDE",           diff: "medium", title: "Binary Tree Level Order Traversal",     topic: "BFS",             hint: "BFS with a queue. Track level size to separate levels.",                                           lp: "" },
  { id: 24, company: "Microsoft", role: "SDE",           diff: "easy",   title: "Maximum Depth of Binary Tree",          topic: "Trees",           hint: "Recursive: 1 + max(depth(left), depth(right)). Base case: null node returns 0.",                  lp: "" },

  // Meta
  { id: 25, company: "Meta",      role: "SDE",           diff: "medium", title: "Clone Graph",                           topic: "Graphs",          hint: "DFS/BFS with a HashMap mapping original nodes to clones. Visit each node once.",                   lp: "" },
  { id: 26, company: "Meta",      role: "SDE",           diff: "hard",   title: "Trapping Rain Water",                   topic: "Two Pointers",    hint: "Two pointer from both ends. Track max left and max right. Water = min(maxL, maxR) - height[i].",   lp: "" },
  { id: 27, company: "Meta",      role: "Frontend",      diff: "medium", title: "Design Facebook News Feed",             topic: "System Design",   hint: "Fan-out on write vs read. Think about ranking, pagination, and cache invalidation.",               lp: "" },
  { id: 28, company: "Meta",      role: "SDE",           diff: "medium", title: "Lowest Common Ancestor of BST",         topic: "Trees",           hint: "If both nodes are smaller than root, go left. If both larger, go right. Otherwise root is LCA.",    lp: "" },
  { id: 29, company: "Meta",      role: "Backend",       diff: "hard",   title: "Design Instagram Stories",              topic: "System Design",   hint: "Think expiry (TTL), blob storage for media, CDN for delivery, fanout for follower feeds.",         lp: "" },
  { id: 30, company: "Meta",      role: "SDE",           diff: "easy",   title: "Move Zeroes",                           topic: "Arrays",          hint: "Two pointers. Left pointer tracks next non-zero position. Swap when right finds non-zero.",         lp: "" },
  { id: 31, company: "Meta",      role: "Data Engineer", diff: "medium", title: "Design Real-time Analytics Pipeline",   topic: "System Design",   hint: "Kafka for ingestion → Spark Streaming → ClickHouse/Druid for OLAP queries.",                     lp: "" },
  { id: 32, company: "Meta",      role: "SDE",           diff: "hard",   title: "Regular Expression Matching",           topic: "DP",              hint: "2D DP. dp[i][j] = true if s[0..i] matches p[0..j]. Handle '.' and '*' carefully.",               lp: "" },

  // Adobe
  { id: 33, company: "Adobe",     role: "Frontend",      diff: "medium", title: "Implement Undo/Redo in a Text Editor",  topic: "Stack",           hint: "Two stacks: undo stack and redo stack. Each action pushes to undo; undo pops to redo.",            lp: "" },
  { id: 34, company: "Adobe",     role: "SDE",           diff: "medium", title: "Edit Distance",                         topic: "DP",              hint: "2D DP. dp[i][j] = min operations to convert s1[0..i] to s2[0..j]. Three choices: insert, delete, replace.", lp: "" },
  { id: 35, company: "Adobe",     role: "Frontend",      diff: "easy",   title: "Implement CSS Specificity Calculator",  topic: "JavaScript",      hint: "Parse selector for IDs (#), classes (.), and elements. Score = [a, b, c] compared lexicographically.", lp: "" },
  { id: 36, company: "Adobe",     role: "SDE",           diff: "hard",   title: "Largest Rectangle in Histogram",        topic: "Stack",           hint: "Monotonic stack. For each bar, find the nearest smaller bar to the left and right.",               lp: "" },
  { id: 37, company: "Adobe",     role: "Backend",       diff: "medium", title: "Design a Document Version Control System", topic: "System Design", hint: "Store diffs (patches) between versions. Think about branching, merging, and conflict resolution.", lp: "" },
  { id: 38, company: "Adobe",     role: "SDE",           diff: "medium", title: "Spiral Matrix",                         topic: "Arrays",          hint: "Maintain four boundaries: top, bottom, left, right. Shrink after each direction traversal.",        lp: "" },
  { id: 39, company: "Adobe",     role: "Frontend",      diff: "medium", title: "Build a Drag-and-Drop Component",       topic: "JavaScript",      hint: "Use HTML5 drag events: dragstart, dragover, drop. Track dragged element and target position.",      lp: "" },
  { id: 40, company: "Adobe",     role: "Data Engineer", diff: "hard",   title: "Design Adobe Analytics Event Pipeline", topic: "System Design",   hint: "Event collection → Kafka → Flink for stream processing → data lake for batch analytics.",         lp: "" },

  // Walmart
  { id: 41, company: "Walmart",   role: "SDE",           diff: "medium", title: "Product of Array Except Self",          topic: "Arrays",          hint: "Two passes: left prefix products, right suffix products. No division needed.",                     lp: "" },
  { id: 42, company: "Walmart",   role: "Backend",       diff: "hard",   title: "Design Inventory Management System",    topic: "System Design",   hint: "Think distributed locks for concurrent stock updates, eventual consistency, and event sourcing.",   lp: "" },
  { id: 43, company: "Walmart",   role: "SDE",           diff: "easy",   title: "Best Time to Buy and Sell Stock",       topic: "Arrays",          hint: "Track min price so far. Max profit = max(profit, price - minPrice).",                             lp: "" },
  { id: 44, company: "Walmart",   role: "Data Engineer", diff: "medium", title: "Find Median from Data Stream",          topic: "Heap",            hint: "Two heaps: max-heap for lower half, min-heap for upper half. Balance sizes after each insert.",    lp: "" },
  { id: 45, company: "Walmart",   role: "SDE",           diff: "medium", title: "Coin Change",                           topic: "DP",              hint: "Bottom-up DP. dp[i] = min coins to make amount i. Try every coin denomination.",                   lp: "" },
  { id: 46, company: "Walmart",   role: "Frontend",      diff: "medium", title: "Build a Shopping Cart with Discounts",  topic: "JavaScript",      hint: "Separate discount logic from cart logic. Apply stacking rules in priority order.",                  lp: "" },
  { id: 47, company: "Walmart",   role: "Backend",       diff: "medium", title: "Design Flash Sale System",              topic: "System Design",   hint: "Pre-warm cache, use Redis atomic DECR for stock, queue excess requests, async order processing.", lp: "" },

  // Flipkart
  { id: 48, company: "Flipkart",  role: "SDE",           diff: "medium", title: "Maximum Subarray (Kadane's Algorithm)", topic: "DP",              hint: "Track current sum and global max. Reset current sum to 0 if it goes negative.",                   lp: "" },
  { id: 49, company: "Flipkart",  role: "Backend",       diff: "hard",   title: "Design Flipkart Search Service",        topic: "System Design",   hint: "Inverted index, TF-IDF ranking, typo tolerance via edit distance, Redis caching for hot queries.", lp: "" },
  { id: 50, company: "Flipkart",  role: "SDE",           diff: "easy",   title: "Detect Cycle in Linked List",           topic: "Linked List",     hint: "Floyd's cycle detection: fast pointer moves 2 steps, slow moves 1. They meet if cycle exists.",    lp: "" },
  { id: 51, company: "Flipkart",  role: "Frontend",      diff: "medium", title: "Implement Infinite Scroll",             topic: "JavaScript",      hint: "IntersectionObserver on a sentinel element at the bottom. Fetch next page when sentinel is visible.", lp: "" },
  { id: 52, company: "Flipkart",  role: "Data Engineer", diff: "hard",   title: "Design Product Recommendation Engine",  topic: "System Design",   hint: "Collaborative filtering + content-based filtering. Offline training, online serving with feature store.", lp: "" },
  { id: 53, company: "Flipkart",  role: "SDE",           diff: "medium", title: "Validate Binary Search Tree",           topic: "Trees",           hint: "Pass min/max bounds recursively. Left subtree max = current node, right subtree min = current node.", lp: "" },
  { id: 54, company: "Flipkart",  role: "Backend",       diff: "medium", title: "Design Order Tracking System",          topic: "System Design",   hint: "Event-driven state machine: placed → confirmed → shipped → delivered. Use Kafka for state transitions.", lp: "" },
  { id: 55, company: "Flipkart",  role: "SDE",           diff: "hard",   title: "Minimum Window Substring",              topic: "Sliding Window",  hint: "Expand right until window is valid, shrink left to minimize. Track char counts with two maps.",     lp: "" },
  { id: 56, company: "Flipkart",  role: "SDE",           diff: "medium", title: "Merge Intervals",                       topic: "Arrays",          hint: "Sort by start time. Merge if current start <= previous end. Update end to max of both.",            lp: "" },
];

const COMPANY_COLORS = {
  Amazon:    { bg: "rgba(255,153,0,0.12)",  border: "rgba(255,153,0,0.3)",  color: "#ff9900" },
  Google:    { bg: "rgba(66,133,244,0.12)", border: "rgba(66,133,244,0.3)", color: "#4285f4" },
  Microsoft: { bg: "rgba(0,164,239,0.12)",  border: "rgba(0,164,239,0.3)",  color: "#00a4ef" },
  Meta:      { bg: "rgba(4,103,223,0.12)",  border: "rgba(4,103,223,0.3)",  color: "#0467df" },
  Adobe:     { bg: "rgba(255,0,0,0.1)",     border: "rgba(255,0,0,0.25)",   color: "#ff0000" },
  Walmart:   { bg: "rgba(0,113,206,0.12)",  border: "rgba(0,113,206,0.3)",  color: "#0071ce" },
  Flipkart:  { bg: "rgba(247,154,43,0.12)", border: "rgba(247,154,43,0.3)", color: "#f79a2b" },
};

function getDiffClass(diff) {
  return { easy: "difficulty-easy", medium: "difficulty-medium", hard: "difficulty-hard" }[diff] || "";
}

/* ─── Core Logic ─── */
function initCIQ() {
  const grid         = document.getElementById("ciqGrid");
  const empty        = document.getElementById("ciqEmpty");
  const searchInput  = document.getElementById("ciqSearch");
  const visibleCount = document.getElementById("visibleCount");
  const totalLabel   = document.getElementById("totalCountLabel");
  const modal        = document.getElementById("ciqModal");
  const modalClose   = document.getElementById("ciqModalClose");

  if (!grid) return;

  totalLabel.textContent = QUESTIONS.length;

  let activeCompany = "all";
  let activeRole    = "all";
  let activeDiff    = "all";
  let searchQuery   = "";

  // Filter button groups
  document.querySelectorAll("#companyFilters .filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#companyFilters .filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeCompany = btn.dataset.company;
      render();
    });
  });

  document.querySelectorAll("#roleFilters .filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#roleFilters .filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeRole = btn.dataset.role;
      render();
    });
  });

  document.querySelectorAll("#diffFilters .filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#diffFilters .filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeDiff = btn.dataset.diff;
      render();
    });
  });

  searchInput.addEventListener("input", () => {
    searchQuery = searchInput.value.toLowerCase().trim();
    render();
  });

  // Modal close
  modalClose.addEventListener("click", () => modal.classList.remove("active"));
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("active"); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") modal.classList.remove("active"); });

  function render() {
    const filtered = QUESTIONS.filter((q) => {
      const matchCompany = activeCompany === "all" || q.company === activeCompany;
      const matchRole    = activeRole    === "all" || q.role    === activeRole;
      const matchDiff    = activeDiff    === "all" || q.diff    === activeDiff;
      const matchSearch  = !searchQuery  || q.title.toLowerCase().includes(searchQuery) || q.topic.toLowerCase().includes(searchQuery) || q.company.toLowerCase().includes(searchQuery);
      return matchCompany && matchRole && matchDiff && matchSearch;
    });

    visibleCount.textContent = filtered.length;

    if (filtered.length === 0) {
      grid.innerHTML = "";
      empty.classList.remove("hidden");
      return;
    }

    empty.classList.add("hidden");
    const co = COMPANY_COLORS;

    grid.innerHTML = filtered.map((q) => {
      const c = co[q.company] || co.Amazon;
      return `
        <div class="ciq-card" data-id="${q.id}">
          <div class="ciq-card-top">
            <span class="ciq-company-badge" style="background:${c.bg}; border-color:${c.border}; color:${c.color};">
              ${q.company}
            </span>
            <span class="difficulty-badge ${getDiffClass(q.diff)}">${q.diff}</span>
          </div>
          <h3>${q.title}</h3>
          <div class="ciq-card-meta">
            <span class="ciq-role-tag">${q.role}</span>
            <span class="ciq-role-tag" style="background:rgba(6,182,212,0.1); color:var(--accent); border-color:rgba(6,182,212,0.2);">${q.topic}</span>
          </div>
          <button class="btn view-answer-btn" data-id="${q.id}">
            <i class="fas fa-lightbulb"></i> View Hint
          </button>
        </div>`;
    }).join("");

    grid.querySelectorAll(".view-answer-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openModal(parseInt(btn.dataset.id));
      });
    });

    grid.querySelectorAll(".ciq-card").forEach((card) => {
      card.addEventListener("click", () => openModal(parseInt(card.dataset.id)));
    });
  }

  function openModal(id) {
    const q = QUESTIONS.find((x) => x.id === id);
    if (!q) return;
    const c = COMPANY_COLORS[q.company] || COMPANY_COLORS.Amazon;

    document.getElementById("ciqModalTitle").textContent = q.title;

    const companyEl = document.getElementById("ciqModalCompany");
    companyEl.textContent = q.company;
    companyEl.style.background = c.bg;
    companyEl.style.borderColor = c.border;
    companyEl.style.color = c.color;

    document.getElementById("ciqModalRole").textContent = q.role;

    const diffEl = document.getElementById("ciqModalDiff");
    diffEl.textContent = q.diff;
    diffEl.className = `difficulty-badge ${getDiffClass(q.diff)}`;

    document.getElementById("ciqModalBody").innerHTML = `
      <p><strong>Topic:</strong> ${q.topic}</p>
      <br>
      <p><strong>💡 Hint:</strong></p>
      <p>${q.hint}</p>
      ${q.lp ? `<br><p><strong>Amazon LP:</strong> ${q.lp}</p>` : ""}
    `;

    modal.classList.add("active");
  }

  render();
}