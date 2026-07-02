/* ─────────────────────────────────────────────
   Data Structure Selection Assistant – Logic
   ───────────────────────────────────────────── */

(function () {
  "use strict";

  // ── Data Structure Definitions ──
  const DS_DATA = {
    array: {
      name: "Array",
      icon: "fa-table-cells",
      color: "#3b82f6",
      tagline: "Simple, cache-friendly, and perfect for index-based access.",
      complexity: {
        search: "O(n)",
        insert: "O(n)",
        delete: "O(n)",
        access: "O(1)",
      },
      strengths: [
        "O(1) random access by index",
        "Cache-friendly memory layout",
        "Simple implementation and low overhead",
        "Great for iteration and sorting",
      ],
      weaknesses: [
        "O(n) insertion and deletion (shifting)",
        "Fixed size or expensive resizing",
        "Poor for frequent mid-list inserts",
      ],
      useCases: [
        "Lookup tables",
        "Buffers",
        "Stack/Queue base",
        "Matrix ops",
      ],
      learnLink: "array-learning.html",
    },

    linkedList: {
      name: "Linked List",
      icon: "fa-link",
      color: "#22c55e",
      tagline:
        "Dynamic size with O(1) insertions at head/tail — ideal for queues and dynamic data.",
      complexity: {
        search: "O(n)",
        insert: "O(1)*",
        delete: "O(1)*",
        access: "O(n)",
      },
      strengths: [
        "O(1) insertion/deletion at known positions",
        "Dynamic size — no pre-allocation",
        "Efficient for queue and deque patterns",
        "No wasted memory from unused capacity",
      ],
      weaknesses: [
        "O(n) search — no random access",
        "Extra memory per node (pointers)",
        "Poor cache locality",
      ],
      useCases: [
        "Queue/Deque",
        "LRU Cache",
        "Undo history",
        "Adjacency lists",
      ],
      learnLink: "linkedlist-learning.html",
    },

    hashMap: {
      name: "HashMap",
      icon: "fa-hashtag",
      color: "#f59e0b",
      tagline:
        "Blazing-fast O(1) average lookups — the go-to for key-value pair storage.",
      complexity: {
        search: "O(1)*",
        insert: "O(1)*",
        delete: "O(1)*",
        access: "O(1)*",
      },
      strengths: [
        "O(1) average search, insert, delete",
        "Perfect for key-value storage",
        "Frequency counting and deduplication",
        "Extremely versatile in coding interviews",
      ],
      weaknesses: [
        "No ordering of elements",
        "O(n) worst case with hash collisions",
        "Higher memory usage",
      ],
      useCases: [
        "Caching",
        "Frequency maps",
        "Two Sum patterns",
        "Indexing",
      ],
      learnLink: "index.html#topics",
    },

    heap: {
      name: "Heap",
      icon: "fa-arrow-up-wide-short",
      color: "#ef4444",
      tagline:
        "Always know the min or max — perfect for priority queues and streaming data.",
      complexity: {
        search: "O(n)",
        insert: "O(log n)",
        delete: "O(log n)",
        access: "O(1)*",
      },
      strengths: [
        "O(1) access to min or max element",
        "O(log n) insertion and extraction",
        "Built on arrays — cache friendly",
        "Ideal for streaming top-K problems",
      ],
      weaknesses: [
        "O(n) general search",
        "Not suitable for arbitrary access",
        "Only min or max — not fully sorted",
      ],
      useCases: [
        "Priority queues",
        "Top-K elements",
        "Median finding",
        "Task scheduling",
      ],
      learnLink: "heaps-learning.html",
    },

    trie: {
      name: "Trie",
      icon: "fa-spell-check",
      color: "#8b5cf6",
      tagline:
        "Purpose-built for prefix search — autocomplete, spell-check, and word games.",
      complexity: {
        search: "O(m)",
        insert: "O(m)",
        delete: "O(m)",
        access: "O(m)",
      },
      strengths: [
        "O(m) lookup (m = key length, not dataset size)",
        "Prefix-based search is natural",
        "Shared prefixes save memory",
        "Ideal for autocomplete features",
      ],
      weaknesses: [
        "High memory per node (pointer arrays)",
        "Overkill for non-string data",
        "Complex implementation vs HashMap",
      ],
      useCases: [
        "Autocomplete",
        "Spell checker",
        "IP routing",
        "Word games",
      ],
      learnLink: "trie-string-learning.html",
    },

    bst: {
      name: "BST (Binary Search Tree)",
      icon: "fa-sitemap",
      color: "#06b6d4",
      tagline:
        "Ordered data with O(log n) operations — supports range queries and in-order traversal.",
      complexity: {
        search: "O(log n)*",
        insert: "O(log n)*",
        delete: "O(log n)*",
        access: "O(log n)*",
      },
      strengths: [
        "O(log n) search, insert, delete (balanced)",
        "Data stays sorted — in-order traversal",
        "Range queries and floor/ceiling ops",
        "Predictable performance with balancing",
      ],
      weaknesses: [
        "Can degrade to O(n) if unbalanced",
        "Complex self-balancing implementations",
        "More overhead than arrays for small data",
      ],
      useCases: [
        "Sorted data",
        "Range queries",
        "Databases",
        "Priority maps",
      ],
      learnLink: "trees-learning.html",
    },
  };

  // ── Question Definitions ──
  const QUESTIONS = [
    {
      id: "fastSearch",
      icon: "fa-magnifying-glass",
      text: "Do you need fast search / lookups?",
      hint: "e.g. checking if a value exists, finding by key, or random access by index.",
      options: [
        { label: "Yes", value: "yes", class: "yes" },
        { label: "Sometimes", value: "sometimes", class: "sometimes" },
        { label: "No", value: "no", class: "no" },
      ],
    },
    {
      id: "frequentInsertions",
      icon: "fa-plus-circle",
      text: "Do you need frequent insertions / deletions?",
      hint: "e.g. adding/removing elements mid-collection, dynamic sizing, or queue operations.",
      options: [
        { label: "Yes", value: "yes", class: "yes" },
        { label: "Sometimes", value: "sometimes", class: "sometimes" },
        { label: "No", value: "no", class: "no" },
      ],
    },
    {
      id: "orderedData",
      icon: "fa-arrow-down-1-9",
      text: "Do you need ordered / sorted data?",
      hint: "e.g. maintaining sort order, range queries, getting min/max, or in-order traversal.",
      options: [
        { label: "Yes", value: "yes", class: "yes" },
        { label: "Sometimes", value: "sometimes", class: "sometimes" },
        { label: "No", value: "no", class: "no" },
      ],
    },
  ];

  // ── Scoring Engine ──
  function computeScores(answers) {
    const scores = {};
    const val = (answer) =>
      answer === "yes" ? 1 : answer === "sometimes" ? 0.5 : 0;

    const search = val(answers.fastSearch);
    const insert = val(answers.frequentInsertions);
    const ordered = val(answers.orderedData);

    // Array — great for access, bad for insert/search
    scores.array =
      (1 - search) * 25 + (1 - insert) * 35 + (1 - ordered) * 20 + 20;

    // Linked List — great for insert, bad for search
    scores.linkedList =
      (1 - search) * 30 + insert * 40 + (1 - ordered) * 15 + 15;

    // HashMap — great for search + insert, no ordering
    scores.hashMap =
      search * 40 + insert * 25 + (1 - ordered) * 25 + 10;

    // Heap — ordered (min/max), good insert, bad arbitrary search
    scores.heap =
      (1 - search) * 15 + insert * 30 + ordered * 40 + 15;

    // Trie — specialized search, moderate insert
    scores.trie =
      search * 30 + insert * 15 + (1 - ordered) * 10 + 15;

    // BST — balanced: good search + ordered + decent insert
    scores.bst =
      search * 30 + insert * 20 + ordered * 35 + 15;

    // Normalize to percentage
    const maxScore = Math.max(...Object.values(scores));
    for (const key in scores) {
      scores[key] = Math.round((scores[key] / maxScore) * 100);
    }

    return scores;
  }

  // ── State ──
  let currentStep = 0;
  const answers = {};

  // ── DOM References ──
  const wizardCard = document.getElementById("dsaWizardCard");
  const resultSection = document.getElementById("dsaResultSection");
  const restartBtn = document.getElementById("dsaRestartBtn");

  if (!wizardCard) return;

  // ── Render Progress ──
  function renderProgress() {
    const container = wizardCard.querySelector(".dsa-progress");
    if (!container) return;

    let html = "";
    for (let i = 0; i < QUESTIONS.length; i++) {
      const isCompleted = i < currentStep;
      const isActive = i === currentStep;
      let stepClass = "";
      if (isCompleted) stepClass = "completed";
      else if (isActive) stepClass = "active";

      html += '<div class="dsa-progress-step ' + stepClass + '">';
      html += isCompleted
        ? '<i class="fas fa-check"></i>'
        : String(i + 1);
      html += "</div>";

      if (i < QUESTIONS.length - 1) {
        html +=
          '<div class="dsa-progress-line ' +
          (isCompleted ? "completed" : "") +
          '"></div>';
      }
    }
    container.innerHTML = html;
  }

  // ── Render Question ──
  function renderQuestion() {
    const panel = wizardCard.querySelector(".dsa-question-panel");
    if (!panel) return;

    const q = QUESTIONS[currentStep];

    panel.classList.remove("dsa-slide-enter");
    panel.classList.add("dsa-slide-exit");

    setTimeout(function () {
      let optionsHTML = "";
      q.options.forEach(function (opt) {
        optionsHTML +=
          '<button class="dsa-answer-btn ' +
          opt.class +
          '" data-value="' +
          opt.value +
          '" aria-label="' +
          opt.label +
          '">';
        optionsHTML += "<span>" + opt.label + "</span>";
        optionsHTML += "</button>";
      });

      panel.innerHTML =
        '<div class="dsa-question-icon"><i class="fas ' +
        q.icon +
        '"></i></div>' +
        '<h2 class="dsa-question-text">' +
        q.text +
        "</h2>" +
        '<p class="dsa-question-hint">' +
        q.hint +
        "</p>" +
        '<div class="dsa-answer-group">' +
        optionsHTML +
        "</div>";

      panel.classList.remove("dsa-slide-exit");
      panel.classList.add("dsa-slide-enter");

      // Attach listeners
      panel.querySelectorAll(".dsa-answer-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          handleAnswer(q.id, btn.dataset.value);
        });
      });
    }, 300);
  }

  // ── Handle Answer ──
  function handleAnswer(questionId, value) {
    answers[questionId] = value;
    currentStep++;
    renderProgress();

    if (currentStep >= QUESTIONS.length) {
      // All questions answered — show result
      setTimeout(showResult, 400);
      // Hide wizard
      wizardCard.style.opacity = "0";
      wizardCard.style.transform = "translateY(-20px)";
      setTimeout(function () {
        wizardCard.style.display = "none";
      }, 400);
    } else {
      renderQuestion();
    }
  }

  // ── Show Result ──
  function showResult() {
    const scores = computeScores(answers);

    // Sort by score descending
    const ranked = Object.keys(scores).sort(function (a, b) {
      return scores[b] - scores[a];
    });
    const bestKey = ranked[0];
    const best = DS_DATA[bestKey];

    // Build primary recommendation
    const recCard = resultSection.querySelector(".dsa-recommendation-card");
    if (recCard) {
      const complexityHTML = Object.entries(best.complexity)
        .map(function (entry) {
          return (
            '<div class="dsa-complexity-chip">' +
            '<span class="dsa-complexity-value">' +
            entry[1] +
            "</span>" +
            '<span class="dsa-complexity-label">' +
            entry[0] +
            "</span>" +
            "</div>"
          );
        })
        .join("");

      const strengthsHTML = best.strengths
        .map(function (s) {
          return '<li><i class="fas fa-check"></i>' + s + "</li>";
        })
        .join("");

      const weaknessesHTML = best.weaknesses
        .map(function (w) {
          return '<li><i class="fas fa-xmark"></i>' + w + "</li>";
        })
        .join("");

      recCard.innerHTML =
        '<div class="dsa-rec-badge"><i class="fas fa-trophy"></i> Best Match</div>' +
        '<div class="dsa-rec-icon" style="background: linear-gradient(135deg, ' +
        best.color +
        ", " +
        best.color +
        '99)"><i class="fas ' +
        best.icon +
        '"></i></div>' +
        '<h2 class="dsa-rec-name dsa-gradient">' +
        best.name +
        "</h2>" +
        '<p class="dsa-rec-tagline">' +
        best.tagline +
        "</p>" +
        '<div class="dsa-complexity-grid">' +
        complexityHTML +
        "</div>" +
        '<div class="dsa-traits-row">' +
        '<div class="dsa-trait-card">' +
        '<div class="dsa-trait-title strengths"><i class="fas fa-circle-check"></i> Strengths</div>' +
        '<ul class="dsa-trait-list">' +
        strengthsHTML +
        "</ul></div>" +
        '<div class="dsa-trait-card">' +
        '<div class="dsa-trait-title weaknesses"><i class="fas fa-circle-exclamation"></i> Weaknesses</div>' +
        '<ul class="dsa-trait-list">' +
        weaknessesHTML +
        "</ul></div></div>" +
        '<a href="' +
        best.learnLink +
        '" class="dsa-learn-btn"><i class="fas fa-book-open"></i> Learn ' +
        best.name +
        "</a>";
    }

    // Build comparison grid
    const grid = resultSection.querySelector(".dsa-comparison-grid");
    if (grid) {
      let gridHTML = "";
      ranked.forEach(function (key) {
        const ds = DS_DATA[key];
        const score = scores[key];
        const isTop = key === bestKey;
        const fillClass =
          score >= 75 ? "high" : score >= 45 ? "medium" : "low";

        const tagsHTML = ds.useCases
          .map(function (uc) {
            return '<span class="dsa-use-tag">' + uc + "</span>";
          })
          .join("");

        gridHTML +=
          '<div class="dsa-compare-card ' +
          (isTop ? "recommended" : "") +
          '">' +
          '<div class="dsa-compare-header">' +
          '<div class="dsa-compare-icon" style="background: ' +
          ds.color +
          '22; color: ' +
          ds.color +
          '"><i class="fas ' +
          ds.icon +
          '"></i></div>' +
          '<div class="dsa-compare-name">' +
          ds.name +
          "</div></div>" +
          '<p class="dsa-compare-desc">' +
          ds.tagline +
          "</p>" +
          '<div class="dsa-match-bar-container">' +
          '<div class="dsa-match-label"><span>Match Score</span><span class="dsa-match-percent">' +
          score +
          "%</span></div>" +
          '<div class="dsa-match-bar"><div class="dsa-match-fill ' +
          fillClass +
          '" data-width="' +
          score +
          '"></div></div></div>' +
          '<div class="dsa-use-cases">' +
          tagsHTML +
          "</div></div>";
      });
      grid.innerHTML = gridHTML;

      // Animate bars
      requestAnimationFrame(function () {
        setTimeout(function () {
          grid.querySelectorAll(".dsa-match-fill").forEach(function (bar) {
            bar.style.width = bar.dataset.width + "%";
          });
        }, 100);
      });
    }

    // Reveal result section
    resultSection.classList.add("visible");
  }

  // ── Restart ──
  function restart() {
    currentStep = 0;
    for (var key in answers) {
      delete answers[key];
    }

    resultSection.classList.remove("visible");

    setTimeout(function () {
      wizardCard.style.display = "";
      wizardCard.style.opacity = "";
      wizardCard.style.transform = "";
      renderProgress();
      renderQuestion();
    }, 400);
  }

  if (restartBtn) {
    restartBtn.addEventListener("click", restart);
  }

  // ── Initial Render ──
  renderProgress();
  renderQuestion();
})();
