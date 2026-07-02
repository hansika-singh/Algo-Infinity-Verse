/* =========================================================
   PERSONALIZED LEARNING PATH — ENHANCED JS
   ========================================================= */

"use strict";

// ── Loading screen ──────────────────────────────────────────
window.addEventListener("load", () => {
  const loader = document.getElementById("loading-screen");
  if (loader) loader.style.display = "none";
});

// ── Constants ───────────────────────────────────────────────
const LS_PREFIX = "plp_v2_";

// ── Rich Topic Data ─────────────────────────────────────────
const PATHS = {
  beginner: [
    {
      name: "Programming Fundamentals",
      icon: '<i class="fas fa-laptop-code" style="color: #38bdf8;"></i>',
      difficulty: "easy",
      hours: 8,
      link: "/index.html#topics",
      desc: "Variables, control flow, functions, recursion basics"
    },
    {
      name: "Arrays & Strings",
      icon: '<i class="fas fa-layer-group" style="color: #a855f7;"></i>',
      difficulty: "easy",
      hours: 10,
      link: "/pages/learning/array-learning/array-learning.html",
      desc: "Traversal, two-pointer, sliding window, sorting"
    },
    {
      name: "Linked Lists",
      icon: '<i class="fas fa-link" style="color: #22c55e;"></i>',
      difficulty: "easy",
      hours: 8,
      link: "/pages/learning/linkedlist-learning/linkedlist-learning.html",
      desc: "Singly, doubly, circular; reversal & cycle detection"
    },
    {
      name: "Stacks & Queues",
      icon: '<i class="fas fa-bars" style="color: #f59e0b;"></i>',
      difficulty: "easy",
      hours: 6,
      link: "/pages/learning/stack-learning/stack-learning.html",
      desc: "Monotonic stack, priority queue, BFS/DFS intro"
    },
    {
      name: "Trees & Binary Search Trees",
      icon: '<i class="fas fa-network-wired" style="color: #ec4899;"></i>',
      difficulty: "medium",
      hours: 10,
      link: "/pages/learning/trees-learning/trees-learning.html",
      desc: "Traversals, height, balance, BST operations"
    },
    {
      name: "Recursion & Backtracking",
      icon: '<i class="fas fa-sync-alt" style="color: #ef4444;"></i>',
      difficulty: "medium",
      hours: 10,
      link: "/pages/learning/recursion-learning/recursion-learning.html",
      desc: "Base cases, call stacks, permutations, N-Queens"
    },
    {
      name: "Sorting Algorithms",
      icon: '<i class="fas fa-sort-amount-up" style="color: #14b8a6;"></i>',
      difficulty: "easy",
      hours: 6,
      link: "/pages/visualizers/sorting-visualizer/sorting-visualizer.html",
      desc: "Merge, quick, heap sort — time & space tradeoffs"
    },
    {
      name: "Dynamic Programming Basics",
      icon: '<i class="fas fa-brain" style="color: #8b5cf6;"></i>',
      difficulty: "hard",
      hours: 14,
      link: "/pages/learning/dp-learning/dp-learning.html",
      desc: "Memoisation, tabulation, knapsack, LCS, LIS"
    },
    {
      name: "System Design Basics",
      icon: '<i class="fas fa-server" style="color: #6366f1;"></i>',
      difficulty: "medium",
      hours: 8,
      link: "/pages/resources/system-design/system-design.html",
      desc: "Scalability, caching, load balancing fundamentals"
    }
  ],
  placement: [
    {
      name: "Aptitude & Reasoning",
      icon: '<i class="fas fa-lightbulb" style="color: #f59e0b;"></i>',
      difficulty: "easy",
      hours: 10,
      link: "/index.html#quiz",
      desc: "Quantitative aptitude, logical reasoning, verbal ability"
    },
    {
      name: "OOP Concepts",
      icon: '<i class="fas fa-cubes" style="color: #38bdf8;"></i>',
      difficulty: "medium",
      hours: 8,
      link: "/index.html#topics", // generic fallback as oop-learning.html might not exist
      desc: "Inheritance, polymorphism, encapsulation, abstraction"
    },
    {
      name: "DBMS & SQL",
      icon: '<i class="fas fa-database" style="color: #10b981;"></i>',
      difficulty: "medium",
      hours: 10,
      link: "/pages/learning/dbms-learning/dbms-learning.html",
      desc: "Normalisation, joins, indexing, transactions"
    },
    {
      name: "Operating Systems",
      icon: '<i class="fas fa-microchip" style="color: #6366f1;"></i>',
      difficulty: "medium",
      hours: 10,
      link: "/pages/learning/os-learning/os-learning.html",
      desc: "Scheduling, memory management, deadlocks, semaphores"
    },
    {
      name: "Computer Networks",
      icon: '<i class="fas fa-globe" style="color: #0ea5e9;"></i>',
      difficulty: "medium",
      hours: 8,
      link: "/index.html#topics",
      desc: "OSI model, TCP/IP, HTTP, DNS, sockets"
    },
    {
      name: "Data Structures Practice",
      icon: '<i class="fas fa-chart-bar" style="color: #a855f7;"></i>',
      difficulty: "hard",
      hours: 20,
      link: "/pages/learning/array-learning/array-learning.html",
      desc: "Arrays, trees, graphs, heaps — 50+ practice problems"
    },
    {
      name: "Behavioural Interview Prep",
      icon: '<i class="fas fa-comments" style="color: #ec4899;"></i>',
      difficulty: "easy",
      hours: 6,
      link: "/pages/interview/behavioral-questions/behavioral-questions.html",
      desc: "STAR method, common HR questions, storytelling"
    },
    {
      name: "Mock Interviews & Tests",
      icon: '<i class="fas fa-tasks" style="color: #ef4444;"></i>',
      difficulty: "hard",
      hours: 12,
      link: "/index.html#quiz",
      desc: "Timed problem sets, mock coding rounds, review"
    }
  ],
  faang: [
    {
      name: "Advanced Array Techniques",
      icon: '<i class="fas fa-boxes" style="color: #14b8a6;"></i>',
      difficulty: "hard",
      hours: 10,
      link: "/pages/learning/array-learning/array-learning.html",
      desc: "Kadane's, Dutch flag, sliding window, two-pointer"
    },
    {
      name: "Graph Algorithms",
      icon: '<i class="fas fa-project-diagram" style="color: #6366f1;"></i>',
      difficulty: "hard",
      hours: 16,
      link: "/pages/learning/graph-learning/graph-learning.html",
      desc: "DFS/BFS, Dijkstra, Bellman-Ford, union-find, topological sort"
    },
    {
      name: "Dynamic Programming (Advanced)",
      icon: '<i class="fas fa-bolt" style="color: #f59e0b;"></i>',
      difficulty: "hard",
      hours: 20,
      link: "/pages/learning/dp-learning/dp-learning.html",
      desc: "Bitmask DP, digit DP, interval DP, SOS DP"
    },
    {
      name: "Bit Manipulation",
      icon: '<i class="fas fa-microchip" style="color: #0ea5e9;"></i>',
      difficulty: "hard",
      hours: 8,
      link: "/pages/learning/bit-manipulation-learning/bit-manipulation-learning.html",
      desc: "Bitmask tricks, XOR patterns, power-of-2 checks"
    },
    {
      name: "Trees & Segment Trees",
      icon: '<i class="fas fa-sitemap" style="color: #10b981;"></i>',
      difficulty: "hard",
      hours: 14,
      link: "/pages/learning/segment-tree-learning/segment-tree-learning.html",
      desc: "AVL, red-black, segment trees, Fenwick trees"
    },
    {
      name: "System Design (Advanced)",
      icon: '<i class="fas fa-server" style="color: #a855f7;"></i>',
      difficulty: "hard",
      hours: 20,
      link: "/pages/resources/system-design/system-design.html",
      desc: "Distributed systems, sharding, CAP theorem, real cases"
    },
    {
      name: "Behavioural Interviews",
      icon: '<i class="fas fa-user-tie" style="color: #ec4899;"></i>',
      difficulty: "medium",
      hours: 8,
      link: "/pages/interview/behavioral-questions/behavioral-questions.html",
      desc: "Leadership principles, conflict resolution, impact stories"
    },
    {
      name: "Competitive Programming Patterns",
      icon: '<i class="fas fa-code" style="color: #f43f5e;"></i>',
      difficulty: "hard",
      hours: 18,
      link: "/index.html#practice",
      desc: "Greedy, two-pointer, divide & conquer, string algorithms"
    },
    {
      name: "Mock Coding Rounds",
      icon: '<i class="fas fa-stopwatch" style="color: #8b5cf6;"></i>',
      difficulty: "hard",
      hours: 16,
      link: "/index.html#quiz",
      desc: "Timed FAANG-style contests, whiteboard problems, review"
    }
  ]
};

// ── Storage Helpers ──────────────────────────────────────────
function getChecked(goal) {
  try {
    return JSON.parse(localStorage.getItem(LS_PREFIX + goal)) || [];
  } catch { return []; }
}

function setChecked(goal, arr) {
  localStorage.setItem(LS_PREFIX + goal, JSON.stringify(arr));
}

function getDailyGoal() {
  return parseFloat(localStorage.getItem(LS_PREFIX + "daily") || "2");
}

function setDailyGoal(val) {
  localStorage.setItem(LS_PREFIX + "daily", String(val));
}

function getStreak() {
  const today = new Date().toDateString();
  const last = localStorage.getItem(LS_PREFIX + "streak_last");
  let count = parseInt(localStorage.getItem(LS_PREFIX + "streak_count") || "0");
  if (!last) return 0;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (last === today) return count;
  if (last === yesterday.toDateString()) return count;
  return 0;
}

function markStreakToday() {
  const today = new Date().toDateString();
  const last = localStorage.getItem(LS_PREFIX + "streak_last");
  let count = parseInt(localStorage.getItem(LS_PREFIX + "streak_count") || "0");

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (last === today) return;
  if (last === yesterday.toDateString()) {
    count += 1;
  } else {
    count = 1;
  }
  localStorage.setItem(LS_PREFIX + "streak_last", today);
  localStorage.setItem(LS_PREFIX + "streak_count", String(count));
}

// ── Toast ────────────────────────────────────────────────────
function showToast(message, icon = "✅", type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-out");
    setTimeout(() => toast.remove(), 350);
  }, 3800);
}

// ── Progress Ring ────────────────────────────────────────────
function updateRing(pct) {
  const fill = document.querySelector(".progress-ring-fill");
  const label = document.querySelector(".progress-ring-pct");
  if (!fill || !label) return;

  const circumference = 352; // 2 * π * r (r=56)
  const offset = circumference - (pct / 100) * circumference;
  fill.style.strokeDashoffset = offset;
  label.textContent = `${Math.round(pct)}%`;
}

// ── ETA Calculator ───────────────────────────────────────────
function calcETA(goal, checkedArr, dailyHours) {
  const topics = PATHS[goal] || [];
  const remaining = topics
    .filter((_, i) => !checkedArr.includes(i))
    .reduce((sum, t) => sum + t.hours, 0);

  if (remaining === 0) return "Complete! 🎉";
  if (!dailyHours || dailyHours <= 0) return "—";

  const daysLeft = Math.ceil(remaining / dailyHours);
  const eta = new Date();
  eta.setDate(eta.getDate() + daysLeft);
  const opts = { month: "short", day: "numeric", year: "numeric" };
  return eta.toLocaleDateString(undefined, opts);
}

// ── Milestone Tracking ───────────────────────────────────────
const MILESTONES = [25, 50, 75, 100];
let lastMilestone = 0;

function checkMilestone(pct) {
  for (const m of MILESTONES) {
    if (pct >= m && lastMilestone < m) {
      lastMilestone = m;
      const icons = { 25: "🌟", 50: "🔥", 75: "💎", 100: "🏆" };
      const msgs = {
        25: "25% done — great start!",
        50: "Halfway there — keep going!",
        75: "75% complete — almost there!",
        100: "Path complete! You're a champion! 🎉"
      };
      showToast(msgs[m], icons[m], "milestone");

      // Glow the ring
      const ring = document.querySelector(".progress-ring-wrap");
      if (ring) {
        ring.classList.add("milestone-glow");
        setTimeout(() => ring.classList.remove("milestone-glow"), 2200);
      }
    }
  }
}

// ── Build Roadmap ────────────────────────────────────────────
function buildRoadmap(goal) {
  const container = document.getElementById("roadmapTimeline");
  if (!container) return;

  if (goal === "personalized") {
    generateDynamicPath();
    return;
  }

  const topics = PATHS[goal] || [];
  const checked = getChecked(goal);

  container.innerHTML = "";
  lastMilestone = Math.floor(
    checked.length > 0 ? (checked.length / topics.length) * 100 / 25 : 0
  ) * 25;

  topics.forEach((topic, i) => {
    const isDone = checked.includes(i);
    const isActive = !isDone && checked.length === i;

    const step = document.createElement("div");
    step.className = `roadmap-step${isDone ? " completed" : ""}${isActive ? " active" : ""}`;
    step.setAttribute("data-index", i);

    step.innerHTML = `
      <div class="step-dot" style="font-size: 1.2rem;">${isDone ? '<i class="fas fa-check" style="color: #fff;" aria-hidden="true" focusable="false"></i>' : '<i class="fas fa-circle" style="color: var(--primary); font-size: 0.6rem;" aria-hidden="true" focusable="false"></i>'}</div>
      <div class="step-card">
        <label for="step-${i}" class="step-icon-label" style="cursor: pointer; font-size: 1.8rem; margin-right: 15px; display: flex; align-items: center; justify-content: center; width: 40px;">
          ${isDone ? '<i class="fas fa-check-circle" style="color: #22c55e;" aria-hidden="true" focusable="false"></i>' : topic.icon}
        </label>
        <input type="checkbox" class="step-checkbox" id="step-${i}" ${isDone ? "checked" : ""} aria-label="${topic.name}" style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;">
        <div class="step-info">
          <div class="step-name ${isDone ? "done" : ""}">
            ${topic.name}
            <span class="diff-badge ${topic.difficulty}">${topic.difficulty}</span>
            <span class="hours-badge">⏱ ${topic.hours}h</span>
          </div>
          <div class="step-desc">${topic.desc}</div>
        </div>
        <div class="step-actions">
          <a href="${topic.link}" class="step-link" target="_blank" rel="noopener">
            <i class="fas fa-arrow-right"></i>
            <span>Learn</span>
          </a>
        </div>
      </div>
    `;

    container.appendChild(step);
  });

  updateProgress(goal);
  attachCheckboxListeners(goal);
}

// ── Update Progress ──────────────────────────────────────────
function updateProgress(goal) {
  const topics = PATHS[goal] || [];
  const checked = getChecked(goal);
  const total = topics.length;
  const done = checked.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const dailyHours = getDailyGoal();

  // Ring
  updateRing(pct);

  // Stats
  const elDone = document.getElementById("statDone");
  const elTotal = document.getElementById("statTotal");
  const elRemaining = document.getElementById("statRemaining");
  const elEta = document.getElementById("statEta");

  if (elDone) elDone.textContent = done;
  if (elTotal) elTotal.textContent = total;
  if (elRemaining) elRemaining.textContent = total - done;
  if (elEta) elEta.textContent = calcETA(goal, checked, dailyHours);

  // Streak
  const elStreak = document.getElementById("streakCount");
  if (elStreak) elStreak.textContent = getStreak();

  checkMilestone(pct);
}

// ── Checkbox Listeners ───────────────────────────────────────
function attachCheckboxListeners(goal) {
  document.querySelectorAll(".step-checkbox").forEach((cb) => {
    cb.addEventListener("change", () => {
      const step = cb.closest(".roadmap-step");
      const index = parseInt(step.getAttribute("data-index"), 10);
      let checked = getChecked(goal);

      if (cb.checked) {
        if (!checked.includes(index)) {
          checked.push(index);
          markStreakToday();
        }
        step.classList.add("completed");
        step.classList.remove("active");
        const dot = step.querySelector(".step-dot");
        if (dot) dot.innerHTML = '<i class="fas fa-check" style="color: #fff;" aria-hidden="true" focusable="false"></i>';
        const labelEl = step.querySelector(".step-icon-label");
        if (labelEl) labelEl.innerHTML = '<i class="fas fa-check-circle" style="color: #22c55e;" aria-hidden="true" focusable="false"></i>';
        const nameEl = step.querySelector(".step-name");
        if (nameEl) nameEl.classList.add("done");
        showToast(`"${PATHS[goal][index].name}" marked complete!`, "✅");
      } else {
        checked = checked.filter((i) => i !== index);
        step.classList.remove("completed");
        const dot = step.querySelector(".step-dot");
        if (dot) dot.innerHTML = '<i class="fas fa-circle" style="color: var(--primary); font-size: 0.6rem;" aria-hidden="true" focusable="false"></i>';
        const labelEl = step.querySelector(".step-icon-label");
        if (labelEl) labelEl.innerHTML = PATHS[goal][index].icon;
        const nameEl = step.querySelector(".step-name");
        if (nameEl) nameEl.classList.remove("done");
      }

      setChecked(goal, checked);
      updateProgress(goal);

      // Re-activate "active" class for next uncompleted step
      document.querySelectorAll(".roadmap-step").forEach((s, i) => {
        const isChecked = getChecked(goal).includes(i);
        s.classList.toggle("active", !isChecked && getChecked(goal).length === i);
      });
    });
  });
}

// ── Main DOMContentLoaded ────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  let activeGoal = null;
  let dailyGoal = getDailyGoal();

  // Goal card selection
  document.querySelectorAll(".goal-card").forEach((card) => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".goal-card").forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      activeGoal = card.getAttribute("data-goal");
      
      const personalRow = document.getElementById("personalizedInputRow");
      if (personalRow) {
        personalRow.style.display = activeGoal === "personalized" ? "flex" : "none";
      }
    });
  });

  // Daily hours input
  const dailyInput = document.getElementById("dailyHoursInput");
  if (dailyInput) {
    dailyInput.value = dailyGoal;
    dailyInput.addEventListener("change", () => {
      dailyGoal = parseFloat(dailyInput.value) || 2;
      setDailyGoal(dailyGoal);
      if (activeGoal) updateProgress(activeGoal);
    });
  }

  // Generate button
  const generateBtn = document.getElementById("generateBtn");
  if (generateBtn) {
    generateBtn.addEventListener("click", () => {
      if (!activeGoal) {
        showToast("Please select a learning goal first!", "⚠️", "success");
        return;
      }
      buildRoadmap(activeGoal);

      // Scroll to roadmap
      document.getElementById("roadmapSection")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  // Reset button
  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (!activeGoal) return;
      if (!confirm(`Reset all progress for the ${activeGoal} path? This cannot be undone.`)) return;
      setChecked(activeGoal, []);
      lastMilestone = 0;
      buildRoadmap(activeGoal);
      showToast("Progress reset successfully.", "🔄");
    });
  }

  // Print/export button
  const printBtn = document.getElementById("printBtn");
  if (printBtn) {
    printBtn.addEventListener("click", () => {
      window.print();
    });
  }

  // Navbar scroll effect
  const navbar = document.querySelector(".navbar");
  if (navbar) {
    window.addEventListener("scroll", () => {
      navbar.classList.toggle("scrolled", window.scrollY > 50);
    }, { passive: true });
  }

  // Scroll-to-top button
  const scrollTopBtn = document.getElementById("scrollTopBtn");
  if (scrollTopBtn) {
    window.addEventListener("scroll", () => {
      scrollTopBtn.classList.toggle("visible", window.scrollY > 300);
    }, { passive: true });
    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Mark streak on load
  markStreakToday();

  // Update streak display immediately
  const elStreak = document.getElementById("streakCount");
  if (elStreak) elStreak.textContent = getStreak();
});

function generateDynamicPath() {
  const container = document.getElementById("roadmapTimeline");
  if (!container) return;

  const categories = ["arrays", "strings", "linkedlist", "trees", "graphs", "dp"];
  const categoryMetadata = {
    arrays: { name: "Arrays & Strings", icon: '<i class="fas fa-layer-group" style="color: #a855f7;"></i>', difficulty: "easy", baseHours: 10, link: "/pages/learning/array-learning/array-learning.html", desc: "Traversal, two-pointer, sliding window, sorting" },
    strings: { name: "String Manipulation", icon: '<i class="fas fa-quote-right" style="color: #38bdf8;"></i>', difficulty: "easy", baseHours: 8, link: "/pages/learning/trie-string-learning/trie-string-learning.html", desc: "Anagrams, palindromes, substring searches, tries" },
    linkedlist: { name: "Linked Lists", icon: '<i class="fas fa-link" style="color: #22c55e;"></i>', difficulty: "easy", baseHours: 8, link: "/pages/learning/linkedlist-learning/linkedlist-learning.html", desc: "Singly, doubly, circular; reversal & cycle detection" },
    trees: { name: "Trees & BSTs", icon: '<i class="fas fa-network-wired" style="color: #ec4899;"></i>', difficulty: "medium", baseHours: 10, link: "/pages/learning/trees-learning/trees-learning.html", desc: "Traversals, height, balance, BST operations" },
    graphs: { name: "Graph Algorithms", icon: '<i class="fas fa-project-diagram" style="color: #6366f1;"></i>', difficulty: "hard", baseHours: 14, link: "/pages/learning/graph-learning/graph-learning.html", desc: "DFS/BFS, Dijkstra, Bellman-Ford, topological sort" },
    dp: { name: "Dynamic Programming", icon: '<i class="fas fa-brain" style="color: #8b5cf6;"></i>', difficulty: "hard", baseHours: 16, link: "/pages/learning/dp-learning/dp-learning.html", desc: "Memoisation, tabulation, knapsack, LCS, LIS" }
  };

  const profile = {};
  categories.forEach(cat => {
    let totalProbs = 0;
    let completedProbs = 0;
    let failureCount = 0;
    
    if (typeof practiceProblems !== "undefined") {
      const probs = practiceProblems.filter(p => p.category.toLowerCase() === cat);
      totalProbs = probs.length;
      completedProbs = probs.filter(p => userProgress.completedProblems.includes(p.id)).length;
    }
    
    const reps = userProgress.spacedRepetition || {};
    for (const pid in reps) {
      const card = reps[pid];
      if (card && card.topic === cat && card.lastQuality < 3) {
        failureCount++;
      }
    }
    
    const quiz = (userProgress.quizScores && userProgress.quizScores[cat]) || { bestScore: 0 };
    const avgQuiz = quiz.bestScore || 0;
    
    let score = 0;
    if (completedProbs > 0 || avgQuiz > 0) {
      const complRatio = totalProbs > 0 ? (completedProbs / totalProbs) : 0.5;
      score = (complRatio * 60) + (avgQuiz * 0.4);
      score = Math.max(0, score - (failureCount * 10));
    } else {
      score = 0;
    }
    
    profile[cat] = {
      score: Math.round(score),
      completed: completedProbs,
      total: totalProbs,
      isWeak: score < 50
    };
  });

  const weeks = parseInt(document.getElementById("prepWeeksInput")?.value) || 2;
  const dailyHours = getDailyGoal();
  const totalHoursLimit = weeks * 7 * dailyHours;
  const customFocus = (document.getElementById("customRefinementText")?.value || "").trim().toLowerCase();

  // Next-best topic logic
  const orderedCategories = [...categories].sort((a, b) => {
    const aFocus = customFocus && categoryMetadata[a].name.toLowerCase().includes(customFocus);
    const bFocus = customFocus && categoryMetadata[b].name.toLowerCase().includes(customFocus);
    if (aFocus && !bFocus) return -1;
    if (bFocus && !aFocus) return 1;

    if (profile[a].isWeak && !profile[b].isWeak) return -1;
    if (profile[b].isWeak && !profile[a].isWeak) return 1;

    const diffMap = { easy: 1, medium: 2, hard: 3 };
    return diffMap[categoryMetadata[a].difficulty] - diffMap[categoryMetadata[b].difficulty];
  });

  // Filter categories to fit timeframe available hours
  let currentHoursSum = 0;
  const recommendedCategories = [];
  
  for (const cat of orderedCategories) {
    const hours = categoryMetadata[cat].baseHours;
    if (currentHoursSum + hours <= totalHoursLimit || recommendedCategories.length === 0) {
      recommendedCategories.push(cat);
      currentHoursSum += hours;
    }
  }

  // Populate PATHS.personalized dynamically so checkbox listeners can read it
  PATHS.personalized = recommendedCategories.map((cat, index) => {
    const meta = categoryMetadata[cat];
    
    // Choose recommended problems
    let problemRecs = [];
    if (typeof practiceProblems !== "undefined") {
      const allCatProbs = practiceProblems.filter(p => p.category.toLowerCase() === cat);
      // Unsolved problems first
      const unsolved = allCatProbs.filter(p => !userProgress.completedProblems.includes(p.id));
      problemRecs = unsolved.slice(0, 2);
      if (problemRecs.length < 2) {
        const solved = allCatProbs.filter(p => userProgress.completedProblems.includes(p.id));
        problemRecs = [...problemRecs, ...solved.slice(0, 2 - problemRecs.length)];
      }
    }

    const recsHtml = problemRecs.length > 0
      ? `<div style="margin-top: 0.5rem; font-size: 0.82rem; color: var(--accent);">
          <i class="fas fa-tasks"></i> Recommended practice: ${problemRecs.map(p => `
            <a href="javascript:void(0)" onclick="openPracticeFromPath(${p.id})" style="color:var(--accent); font-weight:600; text-decoration:underline; margin-right: 0.4rem;">${p.title}</a>
          `).join(" ")}
         </div>`
      : "";

    // Determine badge status
    let statusBadge = `<span class="diff-badge easy" style="background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.3);">Standard</span>`;
    if (profile[cat].isWeak) {
      statusBadge = `<span class="diff-badge hard" style="background:rgba(239,68,68,0.15); color:#ef4444; border:1px solid rgba(239,68,68,0.3); font-weight:bold;">⚠️ Weak Area Target</span>`;
    } else if (customFocus && meta.name.toLowerCase().includes(customFocus)) {
      statusBadge = `<span class="diff-badge medium" style="background:rgba(168,85,247,0.15); color:#a855f7; border:1px solid rgba(168,85,247,0.3); font-weight:bold;">✨ Custom Focus</span>`;
    }

    return {
      name: meta.name,
      icon: meta.icon,
      difficulty: meta.difficulty,
      hours: meta.baseHours,
      link: meta.link,
      desc: `${meta.desc}${recsHtml}`,
      statusBadge
    };
  });

  // Build the timeline cards
  const checked = getChecked("personalized");
  container.innerHTML = "";
  lastMilestone = Math.floor(checked.length > 0 ? (checked.length / PATHS.personalized.length) * 100 / 25 : 0) * 25;

  PATHS.personalized.forEach((topic, i) => {
    const isDone = checked.includes(i);
    const isActive = !isDone && checked.length === i;

    const step = document.createElement("div");
    step.className = `roadmap-step${isDone ? " completed" : ""}${isActive ? " active" : ""}`;
    step.setAttribute("data-index", i);

    step.innerHTML = `
      <div class="step-dot" style="font-size: 1.2rem;">${isDone ? '<i class="fas fa-check" style="color: #fff;" aria-hidden="true" focusable="false"></i>' : '<i class="fas fa-circle" style="color: var(--primary); font-size: 0.6rem;" aria-hidden="true" focusable="false"></i>'}</div>
      <div class="step-card">
        <label for="step-${i}" class="step-icon-label" style="cursor: pointer; font-size: 1.8rem; margin-right: 15px; display: flex; align-items: center; justify-content: center; width: 40px;">
          ${isDone ? '<i class="fas fa-check-circle" style="color: #22c55e;" aria-hidden="true" focusable="false"></i>' : topic.icon}
        </label>
        <input type="checkbox" class="step-checkbox" id="step-${i}" ${isDone ? "checked" : ""} aria-label="${topic.name}" style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;">
        <div class="step-info">
          <div class="step-name ${isDone ? "done" : ""}">
            ${topic.name}
            ${topic.statusBadge}
            <span class="hours-badge">⏱ ${topic.hours}h</span>
          </div>
          <div class="step-desc">${topic.desc}</div>
        </div>
        <div class="step-actions">
          <a href="${topic.link}" class="step-link" target="_blank" rel="noopener">
            <i class="fas fa-arrow-right"></i>
            <span>Learn</span>
          </a>
        </div>
      </div>
    `;

    container.appendChild(step);
  });

  updateProgress("personalized");
  attachCheckboxListeners("personalized");
}

window.openPracticeFromPath = function(problemId) {
  if (typeof practiceProblems !== "undefined") {
    const prob = practiceProblems.find(p => p.id === problemId);
    if (prob && typeof openQuizEditor === "function") {
      openQuizEditor(prob);
    }
  }
};
