document.addEventListener("DOMContentLoaded", () => {

  /* ════════════════════════════════════════════
     DATA
  ════════════════════════════════════════════ */

  const timelineData = [
    {
      era: "Ancient Foundations",
      period: "300 BCE – 1500s CE",
      badge: "Era 1",
      events: [
        {
          year: "~300 BCE", title: "Euclid's Algorithm",
          desc: "Euclid of Alexandria describes the <strong>Euclidean algorithm</strong> — the oldest known algorithm still in common use, for computing the greatest common divisor (GCD) of two numbers.",
          cat: "algorithm", side: "right"
        },
        {
          year: "~200 BCE", title: "Sieve of Eratosthenes",
          desc: "Eratosthenes of Cyrene devises a simple, ancient algorithm for finding all prime numbers up to a given limit — the <strong>Sieve of Eratosthenes</strong>.",
          cat: "algorithm", side: "left"
        },
        {
          year: "825 CE", title: "Al-Khwārizmī & Algebra",
          desc: "Persian mathematician <strong>Muhammad ibn Musa al-Khwārizmī</strong> writes <em>Al-Kitāb al-Mukhtaṣar</em>, introducing systematic algebraic problem-solving. The term <em>algorithm</em> derives from his name.",
          cat: "person", side: "right"
        }
      ]
    },
    {
      era: "Dawn of Computing",
      period: "1600s – 1930s",
      badge: "Era 2",
      events: [
        {
          year: "1614", title: "Napier's Bones & Logarithms",
          desc: "<strong>John Napier</strong> invents logarithms and Napier's bones — a manual calculating device that simplifies multiplication and division, a precursor to mechanical computing.",
          cat: "computing", side: "right"
        },
        {
          year: "1642", title: "Pascaline Calculator",
          desc: "<strong>Blaise Pascal</strong> builds the Pascaline, a mechanical calculator capable of addition and subtraction using geared wheels — one of the first computing machines.",
          cat: "computing", side: "left"
        },
        {
          year: "1822", title: "Difference Engine",
          desc: "<strong>Charles Babbage</strong> designs the Difference Engine, an automatic mechanical calculator. Later, he conceives the Analytical Engine — the first general-purpose computer concept.",
          cat: "computing", side: "right"
        },
        {
          year: "1843", title: "First Computer Algorithm",
          desc: "<strong>Ada Lovelace</strong> writes the first algorithm intended for machine execution — a sequence of operations for Babbage's Analytical Engine to compute Bernoulli numbers. She is widely regarded as the <strong>first programmer</strong>.",
          cat: "person", side: "left"
        },
        {
          year: "1854", title: "Boolean Algebra",
          desc: "<strong>George Boole</strong> publishes <em>An Investigation of the Laws of Thought</em>, laying the foundation of <strong>Boolean algebra</strong> — the logical framework underlying all modern computing.",
          cat: "computing", side: "right"
        },
        {
          year: "1936", title: "Turing Machine",
          desc: "<strong>Alan Turing</strong> introduces the <strong>Turing machine</strong> — a mathematical model of computation that defines the theoretical limits of what computers can do. The foundation of computability theory.",
          cat: "person", side: "left"
        }
      ]
    },
    {
      era: "Birth of Modern CS",
      period: "1940s – 1950s",
      badge: "Era 3",
      events: [
        {
          year: "1945", title: "Von Neumann Architecture",
          desc: "<strong>John von Neumann</strong> describes the stored-program computer architecture — the foundational design still used in virtually all modern computers: CPU, memory, I/O, and stored instructions.",
          cat: "computing", side: "right"
        },
        {
          year: "1947", title: "Flowcharts",
          desc: "<strong>Herman Goldstine</strong> and <strong>John von Neumann</strong> develop the first flowchart notation for representing algorithms visually, revolutionizing how programs are designed.",
          cat: "computing", side: "left"
        },
        {
          year: "1952", title: "Huffman Coding",
          desc: "<strong>David A. Huffman</strong> develops <strong>Huffman coding</strong> — an optimal prefix-code algorithm for lossless data compression, still widely used in file compression formats.",
          cat: "algorithm", side: "right"
        },
        {
          year: "1953", title: "Dynamic Programming",
          desc: "<strong>Richard Bellman</strong> introduces <strong>dynamic programming</strong> — a method for solving complex problems by breaking them into overlapping subproblems and caching results. A cornerstone of algorithm design.",
          cat: "algorithm", side: "left"
        },
        {
          year: "1956", title: "Dijkstra's Algorithm",
          desc: "<strong>Edsger W. Dijkstra</strong> conceives <strong>Dijkstra's shortest path algorithm</strong> while shopping with his fiancée. Published in 1959, it remains one of the most fundamental graph algorithms.",
          cat: "algorithm", side: "right"
        },
        {
          year: "1957", title: "FORTRAN",
          desc: "<strong>John Backus</strong> leads the creation of <strong>FORTRAN</strong> (FORmula TRANslation) — the first high-level programming language, revolutionizing algorithmic expression.",
          cat: "computing", side: "left"
        },
        {
          year: "1958", title: "LISP",
          desc: "<strong>John McCarthy</strong> creates <strong>LISP</strong> — the first functional programming language, introducing recursion as a primary control structure and garbage collection.",
          cat: "computing", side: "right"
        },
        {
          year: "1959", title: "BFS & Linked Lists",
          desc: "<strong>Edward F. Moore</strong> publishes <strong>Breadth-First Search (BFS)</strong>. Around the same time, <strong>Allen Newell, Cliff Shaw, and Herbert Simon</strong> introduce linked lists in IPL (Information Processing Language).",
          cat: "algorithm", side: "left"
        }
      ]
    },
    {
      era: "The Golden Age",
      period: "1960s – 1970s",
      badge: "Era 4",
      events: [
        {
          year: "1960", title: "Binary Search Formalized",
          desc: "<strong>D.H. Lehmer</strong> formally describes <strong>binary search</strong> on sorted arrays — O(log n) search. Though known earlier, this period saw its rigorous analysis and widespread adoption.",
          cat: "algorithm", side: "right"
        },
        {
          year: "1960", title: "Merge Sort",
          desc: "<strong>John von Neumann</strong> (earlier, 1945) describes merge sort; it's formalized as a divide-and-conquer algorithm by <strong>Goldstine and von Neumann</strong>. O(n log n) in all cases.",
          cat: "algorithm", side: "left"
        },
        {
          year: "1962", title: "AVL Trees",
          desc: "<strong>Georgy Adelson-Velsky</strong> and <strong>Evgenii Landis</strong> invent the <strong>AVL tree</strong> — the first self-balancing binary search tree, guaranteeing O(log n) operations.",
          cat: "datastructure", side: "right"
        },
        {
          year: "1962", title: "Quicksort",
          desc: "<strong>Sir Tony Hoare</strong> introduces <strong>Quicksort</strong> — the fastest general-purpose sorting algorithm in practice, with O(n log n) average-case time complexity.",
          cat: "algorithm", side: "left"
        },
        {
          year: "1964", title: "Hash Tables",
          desc: "Early hash table designs are formalized. <strong>Milton Abramson</strong> and others develop open addressing and chaining — fundamental concepts for O(1) average-case dictionary operations.",
          cat: "datastructure", side: "right"
        },
        {
          year: "1968", title: "A* Search Algorithm",
          desc: "<strong>Peter Hart, Nils Nilsson, and Bertram Raphael</strong> describe the <strong>A* search algorithm</strong> — combining Dijkstra's algorithm with heuristic guidance for optimal pathfinding in graphs.",
          cat: "algorithm", side: "left"
        },
        {
          year: "1970", title: "Knuth's The Art of Computer Programming",
          desc: "<strong>Donald Knuth</strong> publishes Volume 1 of <em>The Art of Computer Programming</em>. This monumental series becomes the definitive reference on algorithms and data structures.",
          cat: "person", side: "right"
        },
        {
          year: "1971", title: "NP-Completeness Theory",
          desc: "<strong>Stephen Cook</strong> publishes the paper that establishes <strong>NP-completeness</strong>, proving that the Boolean satisfiability problem (SAT) is NP-complete. This formalizes the P vs. NP question.",
          cat: "computing", side: "left"
        },
        {
          year: "1972", title: "Red-Black Trees",
          desc: "<strong>Rudolf Bayer</strong> invents red-black trees — a balanced BST that guarantees O(log n) operations with less strict balancing than AVL trees, widely used in STL and Linux kernel.",
          cat: "datastructure", side: "right"
        },
        {
          year: "1972", title: "B-Trees",
          desc: "<strong>Rudolf Bayer</strong> and <strong>Edward McCreight</strong> develop <strong>B-trees</strong> — self-balancing tree data structures optimized for disk storage, forming the backbone of almost all database systems.",
          cat: "datastructure", side: "left"
        },
        {
          year: "1975", title: "Union-Find",
          desc: "<strong>Robert Tarjan</strong> and <strong>John Hopcroft</strong> develop efficient <strong>Union-Find</strong> (Disjoint Set Union) with near-constant time operations, essential for graph connectivity problems.",
          cat: "datastructure", side: "right"
        },
        {
          year: "1976", title: "KMP String Matching",
          desc: "<strong>Donald Knuth, James H. Morris, and Vaughan Pratt</strong> develop the <strong>KMP algorithm</strong> — linear-time string matching that avoids backtracking using a prefix function.",
          cat: "algorithm", side: "left"
        }
      ]
    },
    {
      era: "Modern Era",
      period: "1980s – 1990s",
      badge: "Era 5",
      events: [
        {
          year: "1977", title: "RSA Cryptography",
          desc: "<strong>Ron Rivest, Adi Shamir, and Leonard Adleman</strong> publish the <strong>RSA cryptosystem</strong> — the first practical public-key encryption algorithm, foundational to modern internet security.",
          cat: "algorithm", side: "right"
        },
        {
          year: "1981", title: "C++ & OOP",
          desc: "<strong>Bjarne Stroustrup</strong> begins developing <strong>C++</strong>, extending C with object-oriented programming features. It becomes one of the most influential systems programming languages.",
          cat: "computing", side: "left"
        },
        {
          year: "1985", title: "Heaps & Priority Queues",
          desc: "Binary heaps and priority queues become standard, efficiently supporting insert and extract-min/max in O(log n). <strong>Williams</strong> invented the binary heap in 1964, now used everywhere.",
          cat: "datastructure", side: "right"
        },
        {
          year: "1987", title: "MD5 & Cryptographic Hashing",
          desc: "<strong>Ron Rivest</strong> develops <strong>MD5</strong> (Message Digest Algorithm 5), a widely-used cryptographic hash function that produces a 128-bit hash value.",
          cat: "algorithm", side: "left"
        },
        {
          year: "1991", title: "Linux & Git's Precursors",
          desc: "<strong>Linus Torvalds</strong> begins the Linux kernel. While Git arrives in 2005, the open-source movement of the 1990s drives massive collaborative algorithm development.",
          cat: "computing", side: "right"
        },
        {
          year: "1994", title: "STL (Standard Template Library)",
          desc: "<strong>Alexander Stepanov</strong> creates the <strong>C++ STL</strong> — a generic library of algorithms (sort, find, accumulate) and data structures (vector, map, set) based on iterators and templates.",
          cat: "computing", side: "left"
        },
        {
          year: "1996", title: "PageRank Algorithm",
          desc: "<strong>Larry Page</strong> and <strong>Sergey Brin</strong> develop <strong>PageRank</strong> at Stanford — an algorithm that ranks web pages based on link structure, forming the foundation of the Google search engine.",
          cat: "algorithm", side: "right"
        },
        {
          year: "1997", title: "Deep Blue beats Kasparov",
          desc: "IBM's <strong>Deep Blue</strong> defeats world chess champion <strong>Garry Kasparov</strong> — a landmark in AI and tree-search algorithms (alpha-beta pruning, minimax).",
          cat: "computing", side: "left"
        }
      ]
    },
    {
      era: "Contemporary",
      period: "2000s – Present",
      badge: "Era 6",
      events: [
        {
          year: "2004", title: "MapReduce",
          desc: "<strong>Jeffrey Dean</strong> and <strong>Sanjay Ghemawat</strong> publish <strong>MapReduce</strong> — a programming model for processing massive datasets in parallel across distributed clusters.",
          cat: "algorithm", side: "right"
        },
        {
          year: "2005", title: "Git",
          desc: "<strong>Linus Torvalds</strong> creates <strong>Git</strong> — a distributed version control system using a Merkle-tree-based data structure. Git's internal algorithms (reachability, delta compression) are CS masterpieces.",
          cat: "computing", side: "left"
        },
        {
          year: "2006", title: "Dijkstra Wins Turing Award",
          desc: "<strong>Edsger Dijkstra</strong> receives the Turing Award (posthumously for 1972 work but recognized fully in later decades). His legacy spans semaphores, shortest paths, structured programming, and more.",
          cat: "person", side: "right"
        },
        {
          year: "2007", title: "Dynamo & Bigtable",
          desc: "Amazon publishes <strong>Dynamo</strong> (DynamoDB's precursor) and Google publishes <strong>Bigtable</strong> — distributed data stores introducing new algorithms for replication, partitioning, and consistency.",
          cat: "algorithm", side: "left"
        },
        {
          year: "2012", title: "AlexNet & Deep Learning",
          desc: "<strong>Alex Krizhevsky, Ilya Sutskever, and Geoffrey Hinton</strong> win ImageNet with <strong>AlexNet</strong> — a deep convolutional neural network that revolutionizes computer vision algorithm design.",
          cat: "algorithm", side: "right"
        },
        {
          year: "2017", title: "Transformers & Attention",
          desc: "<strong>Vaswani et al.</strong> publish <em>Attention Is All You Need</em>, introducing the <strong>Transformer architecture</strong>. This algorithmic innovation powers GPT, BERT, and virtually all modern LLMs.",
          cat: "algorithm", side: "left"
        },
        {
          year: "2020s", title: "LLMs & Algorithmic Breakthroughs",
          desc: "Large Language Models (GPT-4, Claude, Gemini) advance algorithm generation itself. AI assists in discovering new algorithms (e.g., AlphaDev's faster sorting, AlphaFold for protein folding).",
          cat: "algorithm", side: "right"
        }
      ]
    }
  ];

  const scientistsData = [
    {
      name: "Ada Lovelace", life: "1815 – 1852",
      icon: "fa-solid fa-feather-pointed",
      contributions: "Wrote the first algorithm intended for a machine (Analytical Engine). Widely considered the world's first computer programmer.",
      quote: "That brain of mine is something more than merely mortal, as time will show."
    },
    {
      name: "Alan Turing", life: "1912 – 1954",
      icon: "fa-solid fa-brain",
      contributions: "Introduced the Turing machine, formalizing computation. Broke the Enigma code in WWII. Pioneer of AI and computability theory.",
      quote: "We can only see a short distance ahead, but we can see plenty there that needs to be done."
    },
    {
      name: "John von Neumann", life: "1903 – 1957",
      icon: "fa-solid fa-microchip",
      contributions: "Designed the von Neumann architecture (stored-program computer). Contributed to merge sort, cellular automata, and game theory.",
      quote: "Young man, in mathematics you don't understand things. You just get used to them."
    },
    {
      name: "Edsger W. Dijkstra", life: "1930 – 2002",
      icon: "fa-solid fa-route",
      contributions: "Developed Dijkstra's shortest path algorithm, semaphores (concurrency), and structured programming advocate. Turing Award winner.",
      quote: "Simplicity is a prerequisite for reliability."
    },
    {
      name: "Donald Knuth", life: "1938 – Present",
      icon: "fa-solid fa-book",
      contributions: "Author of <em>The Art of Computer Programming</em>. Inventor of TeX, KMP algorithm, and rigorous algorithm analysis. Turing Award winner.",
      quote: "Science is what we understand well enough to explain to a computer."
    },
    {
      name: "Grace Hopper", life: "1906 – 1992",
      icon: "fa-solid fa-laptop-code",
      contributions: "Developed the first compiler (A-0). Pioneered COBOL and machine-independent programming languages. Popularized the term 'debugging'.",
      quote: "The most damaging phrase in the language is: 'We've always done it this way.'"
    },
    {
      name: "Tony Hoare", life: "1934 – Present",
      icon: "fa-solid fa-sort",
      contributions: "Invented Quicksort. Developed Hoare logic for program verification. Pioneered CSP (Communicating Sequential Processes). Turing Award winner.",
      quote: "There are two ways of constructing a software design: one way is to make it so simple that there are obviously no deficiencies, and the other way is to make it so complicated that there are no obvious deficiencies."
    },
    {
      name: "Robert Tarjan", life: "1948 – Present",
      icon: "fa-solid fa-tree",
      contributions: "Co-developed Union-Find (DSU), Tarjan's SCC algorithm, and splay trees. Pioneered amortized analysis. Turing Award winner.",
      quote: "Any sufficiently advanced bug is indistinguishable from a feature."
    },
    {
      name: "Richard Bellman", life: "1920 – 1984",
      icon: "fa-solid fa-diagram-project",
      contributions: "Invented dynamic programming and the Bellman-Ford algorithm. Applied mathematical optimization to decision processes.",
      quote: "The best way to solve a problem is to have an algorithm for it."
    },
    {
      name: "Stephen Cook", life: "1939 – Present",
      icon: "fa-solid fa-puzzle-piece",
      contributions: "Pioneered NP-completeness theory (Cook's Theorem). Formalized the P vs. NP question — one of CS's greatest open problems. Turing Award winner.",
      quote: "I think the P vs. NP problem is one of the great open problems in mathematics."
    }
  ];

  const milestonesData = [
    { year: "300 BCE", title: "Euclidean Algorithm", desc: "Oldest surviving algorithm — GCD computation by repeated subtraction/division." },
    { year: "1614", title: "Logarithms", desc: "Napier's logarithms turn multiplication into addition — a computational revolution." },
    { year: "1843", title: "First Algorithm", desc: "Ada Lovelace writes the first program — for Bernoulli numbers on the Analytical Engine." },
    { year: "1936", title: "Turing Machine", desc: "Formal model of computation defining what is computable." },
    { year: "1945", title: "Stored-Program Concept", desc: "Von Neumann architecture — program and data share the same memory." },
    { year: "1953", title: "Dynamic Programming", desc: "Bellman formalizes DP — solving problems through overlapping subproblems." },
    { year: "1956", title: "Dijkstra's Algorithm", desc: "Single-source shortest paths on weighted graphs — O(V²) originally." },
    { year: "1960", title: "Binary Search Analysis", desc: "O(log n) search in sorted arrays — one of the most cited algorithms." },
    { year: "1962", title: "AVL Trees", desc: "First self-balancing binary search tree — O(log n) guaranteed." },
    { year: "1962", title: "Quicksort", desc: "Tony Hoare's divide-and-conquer sort — O(n log n) average case." },
    { year: "1968", title: "A* Search", desc: "Heuristic pathfinding combining Dijkstra with greedy best-first search." },
    { year: "1971", title: "NP-Completeness", desc: "Cook's Theorem establishes the class NP-complete." },
    { year: "1972", title: "B-Trees", desc: "Self-balancing tree optimized for block storage — core of all databases." },
    { year: "1976", title: "KMP", desc: "Linear-time string matching without backtracking." },
    { year: "1977", title: "RSA", desc: "First practical public-key cryptosystem — foundation of internet security." },
    { year: "1994", title: "C++ STL", desc: "Generic algorithms and data structures library that set the standard." },
    { year: "1996", title: "PageRank", desc: "Web link analysis algorithm that powered Google's search revolution." },
    { year: "2004", title: "MapReduce", desc: "Distributed processing model for big data across clusters." },
    { year: "2017", title: "Transformers", desc: "Attention-based architecture enabling modern LLMs and foundation models." }
  ];

  /* ════════════════════════════════════════════
     RENDER TIMELINE
  ════════════════════════════════════════════ */

  function renderTimeline(container, data, filter) {
    container.innerHTML = "";

    data.forEach(era => {
      const eraDiv = document.createElement("div");
      eraDiv.className = "tl-era";

      const header = document.createElement("div");
      header.className = "tl-era-header";
      header.innerHTML = `
        <span class="tl-era-badge">${era.badge}</span>
        <h3 class="tl-era-title">${era.era}</h3>
        <p class="tl-era-subtitle">${era.period}</p>
      `;
      eraDiv.appendChild(header);

      let visibleCount = 0;

      era.events.forEach(evt => {
        const pass = !filter || filter === "all" || evt.cat === filter;
        const item = document.createElement("div");
        item.className = `tl-item ${evt.side || "right"}${pass ? "" : " hidden-item"}`;
        if (pass) visibleCount++;

        item.innerHTML = `
          <div class="tl-card">
            <div class="tl-card-header">
              <span class="tl-year">${evt.year}</span>
              <span class="tl-category-tag cat-${evt.cat}">${evt.cat}</span>
            </div>
            <h4 class="tl-card-title">${evt.title}</h4>
            <p class="tl-card-desc">${evt.desc}</p>
          </div>
          <div class="tl-dot"></div>
        `;
        eraDiv.appendChild(item);
      });

      if (visibleCount > 0) {
        container.appendChild(eraDiv);
      }
    });

    setTimeout(observeTimelineItems, 100);
  }

  /* ════════════════════════════════════════════
     RENDER SCIENTISTS
  ════════════════════════════════════════════ */

  function renderScientists(container, data) {
    container.innerHTML = "";
    data.forEach(s => {
      const card = document.createElement("div");
      card.className = "tl-scientist-card";
      card.innerHTML = `
        <div class="tl-scientist-icon"><i class="${s.icon}"></i></div>
        <div class="tl-scientist-name">${s.name}</div>
        <div class="tl-scientist-life">${s.life}</div>
        <div class="tl-scientist-contrib">${s.contributions}</div>
        <div class="tl-scientist-quote">"${s.quote}"</div>
      `;
      container.appendChild(card);
    });
  }

  /* ════════════════════════════════════════════
     RENDER MILESTONES
  ════════════════════════════════════════════ */

  function renderMilestones(container, data) {
    container.innerHTML = "";
    data.forEach(m => {
      const card = document.createElement("div");
      card.className = "tl-milestone-card";
      card.innerHTML = `
        <div class="tl-milestone-year">${m.year}</div>
        <div class="tl-milestone-title">${m.title}</div>
        <div class="tl-milestone-desc">${m.desc}</div>
      `;
      container.appendChild(card);
    });
  }

  /* ════════════════════════════════════════════
     SCROLL REVEAL
  ════════════════════════════════════════════ */

  let tlObserver = null;

  function observeTimelineItems() {
    if (tlObserver) tlObserver.disconnect();

    tlObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            tlObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    document.querySelectorAll(".tl-item").forEach(item => {
      tlObserver.observe(item);
    });
  }

  /* ════════════════════════════════════════════
     INIT TABS
  ════════════════════════════════════════════ */

  const timelineContainer = document.getElementById("timelineContainer");
  const scientistsContainer = document.getElementById("scientistsContainer");
  const milestonesContainer = document.getElementById("milestonesContainer");

  const tabBtns = document.querySelectorAll(".tl-tab");
  const tabContents = document.querySelectorAll(".tl-tab-content");
  const filterBtns = document.querySelectorAll(".tl-filter-btn");

  let currentFilter = "all";

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;

      tabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      tabContents.forEach(c => c.classList.remove("active"));
      const content = document.getElementById(`${target}Tab`);
      if (content) content.classList.add("active");

      if (target === "timeline" && timelineContainer) {
        renderTimeline(timelineContainer, timelineData, currentFilter);
      }
    });
  });

  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      currentFilter = btn.dataset.filter;

      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      if (timelineContainer) {
        renderTimeline(timelineContainer, timelineData, currentFilter);
      }
    });
  });

  /* ════════════════════════════════════════════
     HERO TYPING
  ════════════════════════════════════════════ */

  const words = [
    "Euclidean Algorithm",
    "Quicksort",
    "Dijkstra's Algorithm",
    "Dynamic Programming",
    "PageRank",
    "A* Search",
    "B-Trees",
    "Transformers"
  ];

  const typingEl = document.getElementById("typingTextTimeline");
  if (typingEl) {
    let wIdx = 0, cIdx = 0, deleting = false, tid = null;
    function typeLoop() {
      const w = words[wIdx];
      typingEl.textContent = deleting ? w.substring(0, cIdx - 1) : w.substring(0, cIdx + 1);
      cIdx += deleting ? -1 : 1;
      let speed = deleting ? 40 : 80;
      if (!deleting && cIdx === w.length) { speed = 1800; deleting = true; }
      if (deleting && cIdx === 0) { deleting = false; wIdx = (wIdx + 1) % words.length; speed = 400; }
      tid = setTimeout(typeLoop, speed);
    }
    typeLoop();
    window.addEventListener("beforeunload", () => clearTimeout(tid));
  }

  /* ════════════════════════════════════════════
     STATS COUNTER
  ════════════════════════════════════════════ */

  const counters = document.querySelectorAll(".stat-number[data-target]");
  const counterObs = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        if (el.dataset.counted) return;
        el.dataset.counted = "true";
        const target = parseInt(el.dataset.target, 10);
        let cur = 0;
        const inc = Math.ceil(target / 40);
        const t = setInterval(() => {
          cur += inc;
          if (cur >= target) { cur = target; clearInterval(t); }
          el.textContent = cur;
        }, 30);
        counterObs.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach(c => counterObs.observe(c));

  /* ════════════════════════════════════════════
     INITIAL RENDER
  ════════════════════════════════════════════ */

  if (timelineContainer) renderTimeline(timelineContainer, timelineData, currentFilter);
  if (scientistsContainer) renderScientists(scientistsContainer, scientistsData);
  if (milestonesContainer) renderMilestones(milestonesContainer, milestonesData);

  /* ════════════════════════════════════════════
     NEWSLETTER FORM
  ════════════════════════════════════════════ */

  const nf = document.getElementById("newsletterForm");
  if (nf) {
    nf.addEventListener("submit", e => {
      e.preventDefault();
      const inp = nf.querySelector('input[type="email"]');
      if (!inp || !inp.value.trim()) return;
      const btn = nf.querySelector('button[type="submit"]');
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i>';
      inp.value = "";
      setTimeout(() => { btn.innerHTML = orig; }, 3000);
    });
  }

});
