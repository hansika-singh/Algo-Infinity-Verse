// modules/navbar.js

let scrollPosition = 0;

function lockBodyScroll() {
  scrollPosition = window.scrollY;

  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollPosition}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
}

function unlockBodyScroll() {
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";

  window.scrollTo(0, scrollPosition);
}

// Function to close mobile menu - ADD THIS NEW FUNCTION
function closeMobileMenu() {
  const navLinks = document.getElementById("navLinks");
  const menuToggle = document.getElementById("menuToggle");
  const overlay = document.querySelector(".nav-overlay");
  
  if (navLinks && navLinks.classList.contains("active")) {
    navLinks.classList.remove("active");
    if (menuToggle) {
      menuToggle.setAttribute("aria-expanded", "false");
      const icon = menuToggle.querySelector("i");
      if (icon) {
        icon.classList.remove("fa-times");
        icon.classList.add("fa-bars");
      }
    }
    if (overlay) {
      overlay.classList.remove("active");
    }
    unlockBodyScroll();
  }
}

export function initNavbar() {
  const homeLink = document.querySelector('.nav-link[href="/index.html#home"]');
  if (homeLink) {
    const isHomePage = document.body.getAttribute('data-page') === 'index';
    homeLink.closest('.nav-item').style.display = isHomePage ? 'none' : '';
  }

  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  let overlay = document.querySelector(".nav-overlay");
  if (!overlay && menuToggle && navLinks) {
    overlay = document.createElement("div");
    overlay.className = "nav-overlay";
    document.body.appendChild(overlay);
  }

  const toggleMenu = (open) => {
    const isOpen = open !== undefined ? open : !navLinks.classList.contains("active");
    navLinks.classList.toggle("active", isOpen);
    if (menuToggle) {
      menuToggle.setAttribute("aria-expanded", isOpen);
    }
    if (overlay) {
      overlay.classList.toggle("active", isOpen);
    }
    if (isOpen) {
      lockBodyScroll();
    } else {
      unlockBodyScroll();
    }

    if (menuToggle) {
      const icon = menuToggle.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-bars", !isOpen);
        icon.classList.toggle("fa-times", isOpen);
      }
    }
  };

  // FIXED: This now properly closes the menu
  const closeMenu = () => {
    if (!navLinks.classList.contains("active")) return;
    toggleMenu(false);
  };

  if (menuToggle && navLinks) {
    // Toggle menu on hamburger click
    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    // Close menu on overlay click
    if (overlay) {
      overlay.addEventListener("click", closeMenu);
    }

    // FIX: Close menu on ALL navigation link clicks
    // This includes both desktop and mobile nav links
    const allNavLinks = document.querySelectorAll('.nav-link, .dropdown-item, .mobile-nav-link');
    allNavLinks.forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    // Also close when clicking any link inside navLinks
    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    // Close menu on ESC key - NEW
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeMenu();
      }
    });

    // Close menu on window resize (if going from mobile to desktop) - NEW
    window.addEventListener("resize", () => {
      if (window.innerWidth > 1024 && navLinks.classList.contains("active")) {
        closeMenu();
      }
    });
  }

  initDropdowns();
  initNavbarSearch();
}

function initDropdowns() {
  const dropdownToggles = document.querySelectorAll(".dropdown-toggle");
  const isMobile = () => window.matchMedia("(max-width: 1024px)").matches;

  dropdownToggles.forEach((toggle) => {
    const parent = toggle.closest(".has-dropdown");
    const menu = parent?.querySelector(".dropdown-menu");

    if (!parent || !menu) return;

    // Clean up any existing listeners to prevent duplicates
    const newToggle = toggle.cloneNode(true);
    toggle.parentNode.replaceChild(newToggle, toggle);
    
    // Re-fetch the toggle reference
    const freshToggle = newToggle;
    const freshParent = freshToggle.closest(".has-dropdown");
    const freshMenu = freshParent?.querySelector(".dropdown-menu");

    if (isMobile()) {
      freshToggle.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Close other open dropdowns
        document.querySelectorAll(".has-dropdown.open").forEach((el) => {
          if (el !== freshParent) {
            el.classList.remove("open");
            const toggleBtn = el.querySelector(".dropdown-toggle");
            if (toggleBtn) {
              toggleBtn.setAttribute("aria-expanded", "false");
            }
          }
        });

        const isOpen = freshParent.classList.toggle("open");
        freshToggle.setAttribute("aria-expanded", isOpen);
      });
    } else {
      let hoverTimeout;

      const showMenu = () => {
        clearTimeout(hoverTimeout);
        freshParent.classList.add("open");
        freshToggle.setAttribute("aria-expanded", "true");
      };

      const hideMenu = () => {
        hoverTimeout = setTimeout(() => {
          freshParent.classList.remove("open");
          freshToggle.setAttribute("aria-expanded", "false");
        }, 250);
      };

      freshParent.addEventListener("mouseenter", showMenu);
      freshParent.addEventListener("mouseleave", hideMenu);

      freshToggle.addEventListener("focus", showMenu);
      freshMenu.addEventListener("focusin", showMenu);
      freshParent.addEventListener("focusout", hideMenu);

      freshToggle.addEventListener("click", (e) => {
        if (isMobile()) {
          e.preventDefault();
          const isOpen = freshParent.classList.toggle("open");
          freshToggle.setAttribute("aria-expanded", isOpen);
        }
      });
    }

    // Close dropdown when clicking a dropdown item
    freshMenu.querySelectorAll(".dropdown-item").forEach((item) => {
      item.addEventListener("click", () => {
        if (isMobile()) {
          freshParent.classList.remove("open");
          freshToggle.setAttribute("aria-expanded", "false");
        }
      });
    });
  });

  window.addEventListener("resize", () => {
    if (!isMobile()) {
      document.querySelectorAll(".has-dropdown.open").forEach((el) => {
        el.classList.remove("open");
      });
      // Re-query the live toggles: the ones captured above were replaced via
      // cloneNode/replaceChild, so the original NodeList holds detached nodes.
      document.querySelectorAll(".dropdown-toggle").forEach((toggle) => {
        toggle.setAttribute("aria-expanded", "false");
      });
    }
  });
}

// ===== NAVBAR SEARCH LOGIC =====
function initNavbarSearch() {
  const searchInputs = document.querySelectorAll(".nav-search-input");
  if (!searchInputs.length) return;

  const searchIndex = [
    // Learn - Main
    { title: "DSA Topics", url: "/index.html#topics", category: "Learn", keywords: "dsa topics algorithms structures data arrays stacks queues graphs trees" },
    { title: "Practice Problems", url: "/index.html#practice", category: "Learn", keywords: "practice problems coding solutions challenges leetcode" },
    { title: "Quizzes", url: "/pages/tools/quiz-system/quiz-system.html", category: "Learn", keywords: "quizzes assessments tests knowledge check" },
    { title: "Learning Roadmap", url: "/index.html#roadmap", category: "Learn", keywords: "roadmap path syllabus curriculum guide tracks" },
    { title: "Intermediate Roadmap", url: "/pages/learning/intermediate-roadmap/intermediate-roadmap.html", category: "Learn", keywords: "intermediate roadmap path backend advanced frontend" },
    { title: "Algorithm Timeline", url: "/pages/visualizers/algorithm-timeline/algorithm-timeline.html", category: "Learn", keywords: "algorithm timeline history evolution milestones" },
    { title: "Concept Bridge Trainer", url: "/pages/learning/concept-bridge/concept-bridge.html", category: "Learn", keywords: "concept bridge trainer math science connections analogies" },
    { title: "Problem Solving Framework", url: "/pages/tools/problem-solving-framework/problem-solving-framework.html", category: "Learn", keywords: "problem solving framework template steps methodology" },
    { title: "Think-Aloud AI Judge", url: "/pages/tools/think-aloud-judge/think-aloud-judge.html", category: "Learn", keywords: "think-aloud ai judge feedback review debugger advisor" },
    { title: "Reverse Interview Mode", url: "/pages/interview/reverse-interview/reverse-interview.html", category: "Learn", keywords: "reverse interview client requirement design conversation" },
    { title: "Cognitive Load Analyzer", url: "/pages/tools/cognitive-load-analyzer/cognitive-load-analyzer.html", category: "Learn", keywords: "cognitive load analyzer difficulty readability complexity" },
    { title: "AI Memory Scanner", url: "/pages/tools/memory-scanner/memory-scanner.html", category: "Learn", keywords: "ai memory scanner spaced repetition retention cards flashcards" },
    { title: "Problem Deconstructor", url: "/pages/tools/problem-deconstructor/problem-deconstructor.html", category: "Learn", keywords: "problem deconstructor subproblems divide conquer breakdown" },
    { title: "Cross Topic Trainer", url: "/pages/tools/cross-topic-trainer/cross-topic-trainer.html", category: "Learn", keywords: "cross topic trainer mix graphs trees heaps arrays" },
    { title: "Wrong Turn Replay", url: "/pages/tools/wrong-turn-replay/wrong-turn-replay.html", category: "Learn", keywords: "wrong turn replay debug errors mistakes bug tracker history" },
    { title: "Compare Code", url: "/pages/tools/compare/compare.html", category: "Learn", keywords: "compare code diff solutions languages benchmark performance" },
    { title: "Reverse Complexity", url: "/pages/tools/reverse-complexity/reverse-complexity.html", category: "Learn", keywords: "reverse complexity big o space time code generator constraint" },
    
    // Learn - DSA Topics
    { title: "Learn Arrays", url: "/pages/learning/array-learning/array-learning.html", category: "Data Structures", keywords: "arrays dynamic linear vectors list matrices" },
    { title: "Learn Linked Lists", url: "/pages/learning/linkedlist-learning/linkedlist-learning.html", category: "Data Structures", keywords: "linked lists singly doubly circular pointers nodes" },
    { title: "Learn Stacks", url: "/pages/learning/stack-learning/stack-learning.html", category: "Data Structures", keywords: "stacks lifo push pop callstack brackets balance" },
    { title: "Learn Queues", url: "/pages/visualizers/stack-queue-visualizer/stack-queue-visualizer.html", category: "Data Structures", keywords: "queues stack queue visualizer fifo push pop shift double ended deque circular" },
    { title: "Learn Trees", url: "/pages/learning/trees-learning/trees-learning.html", category: "Data Structures", keywords: "trees bst binary search tree avl red black node" },
    { title: "Tree Traversals", url: "/pages/visualizers/tree-traversal/tree-traversal.html", category: "Data Structures", keywords: "tree traversals inorder preorder postorder levelorder bfs dfs" },
    { title: "Learn Graphs", url: "/pages/learning/graph-learning/graph-learning.html", category: "Data Structures", keywords: "graphs vertices edges adjacent representations list matrix" },
    { title: "Learn Matrix", url: "/pages/learning/matrix-learning/matrix-learning.html", category: "Data Structures", keywords: "matrix grid 2d array dimensions rows columns cells" },
    { title: "Learn Heaps", url: "/pages/learning/heaps-learning/heaps-learning.html", category: "Data Structures", keywords: "heaps priority queue binary min max heap tree" },
    { title: "Learn Prefix Sum", url: "/pages/learning/prefix-sum-learning/prefix-sum-learning.html", category: "Data Structures", keywords: "prefix sum array query range sum linear scan" },
    { title: "Learn Sliding Window", url: "/pages/learning/sliding-window-learning/sliding-window-learning.html", category: "Algorithms", keywords: "sliding window subarray substring unique max sum" },
    { title: "Learn Recursion", url: "/pages/learning/recursion-learning/recursion-learning.html", category: "Algorithms", keywords: "recursion induction call stack base case backtracking" },
    { title: "Learn Divide & Conquer", url: "/pages/learning/divide-and-conquer-learning/divide-and-conquer-learning.html", category: "Algorithms", keywords: "divide conquer merge sort quick binary search" },
    { title: "Learn Bit Manipulation", url: "/pages/learning/bit-manipulation-learning/bit-manipulation-learning.html", category: "Algorithms", keywords: "bit manipulation operations mask shift xor and or not" },
    { title: "Learn Binary Search", url: "/pages/visualizers/pathfinding-visualizer/pathfinding-visualizer.html", category: "Algorithms", keywords: "binary search divide conquer sorted list logarithmic pathfinding" },
    { title: "Learn Shortest Path", url: "/pages/learning/shortest-path-learning/shortest-path-learning.html", category: "Algorithms", keywords: "shortest path dijkstra bellman ford spfa floyd warshall graph" },
    { title: "Learn MST (Minimum Spanning Tree)", url: "/pages/learning/mst-learning/mst-learning.html", category: "Algorithms", keywords: "minimum spanning tree mst kruskal prim graph disjoint set union dsu" },
    { title: "Learn Segment Tree", url: "/pages/learning/segment-tree-learning/segment-tree-learning.html", category: "Data Structures", keywords: "segment tree range queries update sum min max lazy propagation" },
    { title: "Learn Fenwick Tree", url: "/pages/learning/fenwick-tree-learning/fenwick-tree-learning.html", category: "Data Structures", keywords: "fenwick tree binary indexed tree bit range sum point update" },
    { title: "Learn Sparse Table", url: "/pages/learning/sparse-table-learning/sparse-table-learning.html", category: "Data Structures", keywords: "sparse table range queries rmq static array constant time" },
    { title: "Learn Trie & Strings", url: "/pages/learning/trie-string-learning/trie-string-learning.html", category: "Data Structures", keywords: "trie strings suffix tree prefix pattern search autocomplete" },
    { title: "Learn CP Patterns", url: "/pages/learning/cp-patterns-learning/cp-patterns-learning.html", category: "Algorithms", keywords: "cp patterns competitive programming template tricks math" },
    { title: "Learn Bitmask DP", url: "/pages/learning/bitmask-dp-learning/bitmask-dp-learning.html", category: "Algorithms", keywords: "bitmask dp dynamic programming exponential states subset" },
    { title: "Learn DP (Dynamic Programming)", url: "/pages/learning/dp-learning/dp-learning.html", category: "Algorithms", keywords: "dynamic programming dp memoization tabulation knapsack" },

    // Languages & Core
    { title: "Learn Python", url: "/pages/learning/python-learning/python-learning.html", category: "Languages", keywords: "python basics core syntax loops list dict oop" },
    { title: "Learn JavaScript", url: "/pages/learning/javascript-learning/javascript-learning.html", category: "Languages", keywords: "javascript es6 async promise DOM fetch object functional" },
    { title: "Learn Java", url: "/pages/learning/java-learning/java-learning.html", category: "Languages", keywords: "java oop inheritance polymorphism collections stream multithread" },
    { title: "Learn C++", url: "/pages/learning/cplusplus-learning/cplusplus-learning.html", category: "Languages", keywords: "c++ cpp stl pointers references structures class templates" },
    { title: "Learn C", url: "/pages/learning/c-learning/c-learning.html", category: "Languages", keywords: "c manual memory malloc pointers structures files low level" },
    { title: "Learn PHP", url: "/pages/learning/php-learning/php-learning.html", category: "Languages", keywords: "php web backend server request db mysql session" },
    { title: "Learn DBMS", url: "/pages/learning/dbms-learning/dbms-learning.html", category: "Core CS", keywords: "dbms database relational sql normal forms transactions acid locks" },
    { title: "Learn Operating Systems", url: "/pages/learning/os-learning/os-learning.html", category: "Core CS", keywords: "operating systems os threads processes scheduling memory paging deadlock virtual" },
    { title: "Learn Comp. Architecture", url: "/pages/learning/computer-architecture/computer-architecture.html", category: "Core CS", keywords: "computer architecture assembly cpu cache registers pipeline instructions" },
    { title: "Learn OOP (Object Oriented Programming)", url: "/pages/learning/oop-learning/oop-learning.html", category: "Core CS", keywords: "oop object oriented inheritance polymorphism encapsulation abstraction interfaces" },
    { title: "Learn SQL", url: "/pages/learning/sql-learning/sql-learning.html", category: "Core CS", keywords: "sql query databases select join group by indexes optimization schemas" },
    { title: "Learn Power BI", url: "/pages/learning/powerbi-learning/powerbi-learning.html", category: "Core CS", keywords: "power bi data analysis visualization dashboard reports query dax" },

    // System Design
    { title: "Learn System Design", url: "/pages/resources/system-design/system-design.html", category: "System Design", keywords: "system design scalability load balancer caching sharding microservices replication cap" },
    { title: "Learn API Design", url: "/pages/learning/api-design-learning/api-design-learning.html", category: "System Design", keywords: "api design rest graphql gRPC status codes endpoints auth rate limiting spec" },
    { title: "Learn Cache Systems", url: "/pages/learning/cache-learning/cache-learning.html", category: "System Design", keywords: "cache systems lru lfu eviction policies write back through consistency cache hit miss" },

    // Visualizers & Tools
    { title: "Sorting Visualizer", url: "/pages/sort/sorting-visualizer.html", category: "Visualizers", keywords: "sorting visualizer bubble merge quick heap comparison animation" },
    { title: "Graph Visualizer", url: "/pages/visualizers/graph-visualizer/graph-visualizer.html", category: "Visualizers", keywords: "graph visualizer representation bfs dfs adjacency list" },
    { title: "Pathfinding Visualizer", url: "/pages/visualizers/pathfinding-visualizer/pathfinding-visualizer.html", category: "Visualizers", keywords: "pathfinding visualizer a star dijkstra bfs dfs maze generator grid" },
    { title: "Recursion Tree Visualizer", url: "/pages/visualizers/recursion-tree-visualizer/recursion-tree-visualizer.html", category: "Visualizers", keywords: "recursion tree visualizer fibonacci call stack tree visualization" },
    { title: "Tree Visualizer", url: "/pages/visualizers/tree-visualizer/tree-visualizer.html", category: "Visualizers", keywords: "tree visualizer bst binary search tree heap visualizer" },
    { title: "Complexity Calculator", url: "/pages/tools/complexity-calculator/complexity-calculator.html", category: "Tools", keywords: "complexity calculator space time complexity analyser big o calculator" },
    { title: "Pattern Recognition Trainer", url: "/pages/tools/pattern-trainer/pattern-trainer.html", category: "Tools", keywords: "pattern recognition trainer identify problems clues" },
    { title: "Edge Case Generator", url: "/pages/tools/edge-case-generator/edge-case-generator.html", category: "Tools", keywords: "edge case generator arrays strings extreme inputs numbers bounds check" },
    { title: "Dry Run Simulator", url: "/pages/tools/dry-run-simulator/dry-run-simulator.html", category: "Tools", keywords: "dry run simulator code trace variables step execution state debugger" },
    { title: "Solution Evolution", url: "/pages/tools/solution-evolution/solution-evolution.html", category: "Tools", keywords: "solution evolution brute force optimized optimized space code transformation" },
    { title: "Algorithm Crime Lab", url: "/pages/tools/investigation-lab/investigation-lab.html", category: "Tools", keywords: "algorithm crime lab investigate bugs logs crash dumps issues debug" },
    { title: "DSA Mythbusters", url: "/pages/tools/algorithm-mythology/algorithm-mythology.html", category: "Tools", keywords: "dsa mythbusters misconceptions myths truths structures" },
    { title: "Algorithm Arena", url: "/pages/tools/algorithm-arena/algorithm-arena.html", category: "Tools", keywords: "algorithm arena battle code competition challenges game math" },
    { title: "Algorithms in Real Apps", url: "/pages/tools/everyday-apps/everyday-apps.html", category: "Tools", keywords: "algorithms in real apps everyday applications autocomplete search GPS database index" },
    { title: "Weakness Dashboard", url: "/pages/tools/topic-weakness-dashboard/topic-weakness-dashboard.html", category: "Tools", keywords: "weakness dashboard stats tracking progress score card review recommendations" },

    // Editors
    { title: "Python Editor", url: "/pages/editors/python-editor/python-editor.html", category: "Editors", keywords: "python editor compiler runner playground scratchpad" },
    { title: "Java Editor", url: "/pages/editors/java-editor/java-editor.html", category: "Editors", keywords: "java editor compiler runner playground scratchpad" },
    { title: "C++ Editor", url: "/pages/editors/cpp-editor/cpp-editor.html", category: "Editors", keywords: "c++ cpp editor compiler runner playground scratchpad" },
    { title: "C Editor", url: "/pages/editors/c-editor/c-editor.html", category: "Editors", keywords: "c editor compiler runner playground scratchpad" },
    { title: "PHP Editor", url: "/pages/editors/php-editor/php-editor.html", category: "Editors", keywords: "php editor compiler runner playground scratchpad" },
    { title: "Ruby Editor", url: "/pages/editors/ruby-editor/ruby-editor.html", category: "Editors", keywords: "ruby editor compiler runner playground scratchpad" },
    { title: "Scala Editor", url: "/pages/editors/scala-editor/scala-editor.html", category: "Editors", keywords: "scala editor compiler runner playground scratchpad" },
    { title: "Go Editor", url: "/pages/editors/go-editor/go-editor.html", category: "Editors", keywords: "go editor compiler runner playground scratchpad" },
    { title: "HTML Editor", url: "/pages/editors/html-editor/html-editor.html", category: "Editors", keywords: "html css js editor preview iframe live design" },
    { title: "SQL Editor", url: "/pages/editors/sql-editor/sql-editor.html", category: "Editors", keywords: "sql database editor query terminal tables sandbox" },
    { title: "React Playground", url: "/pages/editors/react-playground/react-playground.html", category: "Editors", keywords: "react playground components live compile state props rendering sandbox" },
    { title: "Code Playground", url: "/Playground/playground.html", category: "Editors", keywords: "code playground editor compiler runner multi language sandbox" },

    // Career & Interview
    { title: "DSA Cheat Sheets", url: "/pages/resources/cheat-sheets/cheat-sheets.html", category: "Interview", keywords: "dsa cheat sheets formula summary revision fast track reference" },
    { title: "Interview Experiences", url: "/pages/interview/interview-experience/interview-experience.html", category: "Interview", keywords: "interview experiences faang reviews questions answers database" },
    { title: "Interview Heatmap", url: "/pages/interview/interview-heatmap/interview-heatmap.html", category: "Interview", keywords: "interview heatmap tracking calendar schedule logs prep progress" },
    { title: "Interview Mistakes", url: "/pages/interview/interview-mistakes/interview-mistakes.html", category: "Interview", keywords: "interview mistakes common errors bugs logic communication anti patterns" },

    // Community & General
    { title: "Discussions Forum", url: "/community", category: "Community", keywords: "discussions community threads replies topics comments questions share" },
    { title: "Leaderboard / Dashboard", url: "/index.html#dashboard", category: "Community", keywords: "leaderboard dashboard ranking score points level user progress stats" },
    { title: "Support Hub", url: "/support-page", category: "Community", keywords: "support page help desk tickets issues contact us details" },
    { title: "Feedback", url: "/feedback", category: "Community", keywords: "feedback review suggestions bugs report improvements forms" },
    { title: "About Us", url: "/pages/resources/about-us.html", category: "Community", keywords: "about us team mission story timeline contributors project information" },
    { title: "FAQ", url: "/pages/resources/faq/faq.html", category: "Community", keywords: "faq frequently asked questions help answers troubleshooting guide" },
    { title: "Blog", url: "/pages/resources/blog/blog.html", category: "Community", keywords: "blog articles news updates stories coding tips resources publications" }
  ];

  // Helper to escape regex special characters
  const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Helper to highlight matching text in title
  const highlightText = (text, query) => {
    if (!query) return text;
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.length) return text;
    let highlighted = text;
    tokens.forEach(token => {
      const regex = new RegExp(`(${escapeRegExp(token)})`, "gi");
      highlighted = highlighted.replace(regex, `<mark class="search-highlight">$1</mark>`);
    });
    return highlighted;
  };

  searchInputs.forEach(input => {
    const wrapper = input.closest(".nav-search");
    if (!wrapper) return;
    const clearBtn = wrapper.querySelector(".clear-search-btn");
    const dropdown = wrapper.querySelector(".search-dropdown");
    let activeSuggestionIndex = -1;

    // Load recent searches and frequently visited from localStorage
    const getRecentSearches = () => {
      try {
        return JSON.parse(localStorage.getItem("nav_recent_searches")) || [];
      } catch {
        return [];
      }
    };

    const addRecentSearch = (query) => {
      if (!query || !query.trim()) return;
      const cleanQuery = query.trim();
      let recent = getRecentSearches();
      recent = recent.filter(q => q.toLowerCase() !== cleanQuery.toLowerCase());
      recent.unshift(cleanQuery);
      if (recent.length > 5) recent.pop();
      localStorage.setItem("nav_recent_searches", JSON.stringify(recent));
    };

    const removeRecentSearch = (query) => {
      let recent = getRecentSearches();
      recent = recent.filter(q => q !== query);
      localStorage.setItem("nav_recent_searches", JSON.stringify(recent));
    };

    const getFrequentlyVisited = () => {
      try {
        const visited = JSON.parse(localStorage.getItem("nav_frequently_visited")) || {};
        const sorted = Object.entries(visited)
          .map(([url, count]) => {
            const page = searchIndex.find(p => p.url === url);
            return page ? { ...page, count } : null;
          })
          .filter(Boolean)
          .sort((a, b) => b.count - a.count);
        return sorted.slice(0, 5);
      } catch {
        return [];
      }
    };

    const trackPageVisit = (url) => {
      try {
        const visited = JSON.parse(localStorage.getItem("nav_frequently_visited")) || {};
        visited[url] = (visited[url] || 0) + 1;
        localStorage.setItem("nav_frequently_visited", JSON.stringify(visited));
      } catch (e) {
        console.warn("Could not track page visit:", e);
      }
    };

    const syncAllInputs = (value) => {
      searchInputs.forEach(inp => {
        if (inp.value !== value) {
          inp.value = value;
          const wrp = inp.closest(".nav-search");
          if (wrp) {
            const clr = wrp.querySelector(".clear-search-btn");
            if (clr) clr.style.display = value ? "flex" : "none";
          }
        }
      });
    };

    const renderDropdown = (query = "") => {
      if (!dropdown) return;
      dropdown.innerHTML = "";
      activeSuggestionIndex = -1;

      if (!query.trim()) {
        const recent = getRecentSearches();
        const popular = getFrequentlyVisited();

        const defaultPopular = [
          { title: "DSA Cheat Sheets", url: "/cheat-sheets.html", category: "Interview" },
          { title: "Practice Problems", url: "/index.html#practice", category: "Learn" },
          { title: "Sorting Visualizer", url: "/sorting-visualizer.html", category: "Visualizers" },
          { title: "Assessments", url: "/quiz-system.html", category: "Learn" },
          { title: "Learning Path Generator", url: "/personalized-learning-path.html", category: "Editors" }
        ];

        const popularList = popular.length ? popular : defaultPopular.slice(0, 5);
        let hasContent = false;

        if (recent.length) {
          hasContent = true;
          const section = document.createElement("div");
          section.className = "search-dropdown-section";
          section.innerHTML = `<div class="search-section-title">Recent Searches</div>`;

          recent.forEach(q => {
            const item = document.createElement("div");
            item.className = "recent-item";
            
            const link = document.createElement("a");
            link.className = "recent-link";
            link.innerHTML = `<i class="fas fa-history"></i><span>${escapeHtml(q)}</span>`;
            link.addEventListener("click", (e) => {
              e.preventDefault();
              syncAllInputs(q);
              renderDropdown(q);
            });

            const removeBtn = document.createElement("button");
            removeBtn.className = "remove-recent-btn";
            removeBtn.setAttribute("aria-label", "Remove from history");
            removeBtn.innerHTML = `<i class="fas fa-trash-can"></i>`;
            removeBtn.addEventListener("click", (e) => {
              e.preventDefault();
              e.stopPropagation();
              removeRecentSearch(q);
              renderDropdown();
            });

            item.appendChild(link);
            item.appendChild(removeBtn);
            section.appendChild(item);
          });
          dropdown.appendChild(section);
        }

        if (popularList.length) {
          hasContent = true;
          const section = document.createElement("div");
          section.className = "search-dropdown-section";
          section.innerHTML = `<div class="search-section-title">${popular.length ? "Frequently Visited" : "Popular Pages"}</div>`;

          popularList.forEach(page => {
            const link = document.createElement("a");
            link.href = page.url;
            link.className = "suggestion-item";
            link.innerHTML = `
              <div class="suggestion-content">
                <span class="suggestion-title">${escapeHtml(page.title)}</span>
                <span class="suggestion-path">Navigation &gt; ${escapeHtml(page.category)}</span>
              </div>
              <span class="suggestion-badge">${escapeHtml(page.category)}</span>
              <i class="fas fa-chevron-right suggestion-arrow"></i>
            `;
            link.addEventListener("click", () => {
              trackPageVisit(page.url);
              addRecentSearch(page.title);
            });
            section.appendChild(link);
          });
          dropdown.appendChild(section);
        }

        dropdown.style.display = hasContent ? "block" : "none";
        return;
      }

      const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
      const matches = searchIndex.filter(item => {
        const titleMatch = tokens.every(tok => item.title.toLowerCase().includes(tok));
        const catMatch = tokens.every(tok => item.category.toLowerCase().includes(tok));
        const keywordMatch = tokens.every(tok => item.keywords.toLowerCase().includes(tok));
        return titleMatch || catMatch || keywordMatch;
      });

      if (!matches.length) {
        dropdown.innerHTML = `
          <div class="search-no-results">
            <i class="fas fa-triangle-exclamation"></i>
            <span>No results found for "${escapeHtml(query)}"</span>
          </div>
        `;
        dropdown.style.display = "block";
        return;
      }

      const section = document.createElement("div");
      section.className = "search-dropdown-section";
      section.innerHTML = `<div class="search-section-title">Matches (${matches.length})</div>`;

      matches.forEach(page => {
        const link = document.createElement("a");
        link.href = page.url;
        link.className = "suggestion-item";
        link.innerHTML = `
          <div class="suggestion-content">
            <span class="suggestion-title">${highlightText(page.title, query)}</span>
            <span class="suggestion-path">Navigation &gt; ${escapeHtml(page.category)}</span>
          </div>
          <span class="suggestion-badge">${escapeHtml(page.category)}</span>
          <i class="fas fa-chevron-right suggestion-arrow"></i>
        `;
        link.addEventListener("click", () => {
          trackPageVisit(page.url);
          addRecentSearch(page.title);
        });
        section.appendChild(link);
      });
      dropdown.appendChild(section);
      dropdown.style.display = "block";
    };

    const escapeHtml = (unsafe) => {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    input.addEventListener("input", (e) => {
      const val = e.target.value;
      syncAllInputs(val);
      renderDropdown(val);
    });

    input.addEventListener("focus", () => {
      setTimeout(() => {
        renderDropdown(input.value);
      }, 150);
    });

    document.addEventListener("click", (e) => {
      if (!wrapper.contains(e.target)) {
        dropdown.style.display = "none";
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        syncAllInputs("");
        renderDropdown();
        input.focus();
      });
    }

    input.addEventListener("keydown", (e) => {
      const items = dropdown.querySelectorAll(".suggestion-item, .recent-link");
      if (!items.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeSuggestionIndex = (activeSuggestionIndex + 1) % items.length;
        updateSelectedSuggestion(items);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeSuggestionIndex = (activeSuggestionIndex - 1 + items.length) % items.length;
        updateSelectedSuggestion(items);
      } else if (e.key === "Enter") {
        if (activeSuggestionIndex >= 0 && activeSuggestionIndex < items.length) {
          e.preventDefault();
          items[activeSuggestionIndex].click();
        } else if (items.length > 0) {
          e.preventDefault();
          items[0].click();
        }
      } else if (e.key === "Escape") {
        dropdown.style.display = "none";
        input.blur();
      }
    });

    const updateSelectedSuggestion = (items) => {
      items.forEach((item, index) => {
        if (index === activeSuggestionIndex) {
          item.classList.add("selected");
          item.focus();
          item.scrollIntoView({ block: "nearest" });
        } else {
          item.classList.remove("selected");
        }
      });
      input.focus();
    };
  });
}

// Export all functions
// Note: initNavbar is already exported inline at its declaration, so it must
// not be re-exported here — a duplicate export makes the whole module fail to load.
export { closeMobileMenu, lockBodyScroll, unlockBodyScroll };