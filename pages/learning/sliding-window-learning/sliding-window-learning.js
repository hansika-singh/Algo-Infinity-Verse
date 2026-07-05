/**
 * sliding-window-learning.js
 * Interactivity for the Sliding Window Learning page:
 *  - Hero typing animation
 *  - Stats counter animation (uses global animateValue from script.js)
 *  - Sidebar scroll-spy (active link tracking)
 *  - Progress bar (tracks completed topics via localStorage)
 *  - Exercise toggle (show/hide solutions)
 *  - Copy code button
 */

document.addEventListener("DOMContentLoaded", () => {
  initHeroTyping();
  initStatsAnimation();
  initExerciseToggles();
  initCopyButtons();
  initSidebarSpy();
  initProgressTracker();
  initSlidingWindowVisualizer();
});

/* ─────────────────────────────────────────────
   Hero Typing Animation
   ───────────────────────────────────────────── */
function initHeroTyping() {
  const el = document.getElementById("typingTextSlidingWindow");
  if (!el) return;

  const words = [
    "Fixed Size Window",
    "Dynamic Size Window",
    "Two Pointers",
    "Optimization",
    "Subarrays & Substrings",
    "O(N) Time Complexity",
  ];

  let wordIdx = 0;
  let charIdx = 0;
  let isDeleting = false;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (prefersReducedMotion) {
    el.textContent = words[0];
    return;
  }

  function tick() {
    const current = words[wordIdx];

    if (isDeleting) {
      el.textContent = current.substring(0, charIdx - 1);
      charIdx--;
    } else {
      el.textContent = current.substring(0, charIdx + 1);
      charIdx++;
    }

    let speed = isDeleting ? 50 : 100;

    if (!isDeleting && charIdx === current.length) {
      speed = 2000;
      isDeleting = true;
    } else if (isDeleting && charIdx === 0) {
      isDeleting = false;
      wordIdx = (wordIdx + 1) % words.length;
      speed = 500;
    }

    requestAnimationFrame(() => setTimeout(tick, speed));
  }

  tick();
}

/* ─────────────────────────────────────────────
   Stats Counter Animation
   ───────────────────────────────────────────── */
function initStatsAnimation() {
  const statNumbers = document.querySelectorAll(".stat-number[data-target]");
  if (!statNumbers.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (typeof animateValue === "function") {
            animateValue(entry.target);
          }
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5, rootMargin: "0px 0px -50px 0px" },
  );

  statNumbers.forEach((s) => observer.observe(s));
}

/* ─────────────────────────────────────────────
   Exercise Show/Hide Toggle
   ───────────────────────────────────────────── */
function initExerciseToggles() {
  document
    .querySelectorAll(".sliding-window-exercise-toggle")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("aria-controls");
        const solution = document.getElementById(targetId);
        if (!solution) return;

        const isVisible = solution.classList.toggle("visible");
        btn.setAttribute("aria-expanded", isVisible);
        btn.textContent = isVisible ? "Hide Solution" : "Show Solution";
      });
    });
}

/* ─────────────────────────────────────────────
   Copy Code Button
   ───────────────────────────────────────────── */
function initCopyButtons() {
  document.querySelectorAll(".sliding-window-code-copy").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const code = btn.getAttribute("data-code");
      if (!code) return;

      try {
        await navigator.clipboard.writeText(code);
        btn.textContent = "Copied!";
        btn.classList.add("copied");
        setTimeout(() => {
          btn.textContent = "Copy";
          btn.classList.remove("copied");
        }, 2000);
      } catch {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = code;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        btn.textContent = "Copied!";
        btn.classList.add("copied");
        setTimeout(() => {
          btn.textContent = "Copy";
          btn.classList.remove("copied");
        }, 2000);
      }
    });
  });
}

/* ─────────────────────────────────────────────
   Sidebar Scroll-Spy
   ───────────────────────────────────────────── */
function initSidebarSpy() {
  const links = document.querySelectorAll(".sliding-window-sidebar-nav a");
  const lessons = document.querySelectorAll(".sliding-window-lesson");
  if (!links.length || !lessons.length) return;

  const NAV_HEIGHT = 100; // offset for fixed navbar

  function getActiveId() {
    let bestId = null;
    let bestDist = Infinity;

    lessons.forEach((lesson) => {
      const rect = lesson.getBoundingClientRect();
      const dist = Math.abs(rect.top - NAV_HEIGHT);
      if (dist < bestDist) {
        bestDist = dist;
        bestId = lesson.getAttribute("id");
      }
    });

    return bestId;
  }

  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const id = getActiveId();
      if (id) {
        links.forEach((l) => l.classList.remove("active"));
        const active = document.querySelector(
          `.sliding-window-sidebar-nav a[href="#${id}"]`,
        );
        if (active) active.classList.add("active");
      }
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll(); // run once on load
}

/* ─────────────────────────────────────────────
   Progress Tracker
   ───────────────────────────────────────────── */
function initProgressTracker() {
  const STORAGE_KEY = "sliding-window-learning-progress";
  const TOTAL_TOPICS = 5; // Adjust this if you change the number of topics
  const fill = document.getElementById("progressFill");
  const count = document.getElementById("progressCount");
  const bar = document.querySelector(".sliding-window-progress-bar");

  if (!fill || !count) return;

  let completed = new Set();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) completed = new Set(saved);
  } catch {
    /* ignore */
  }

  function updateUI() {
    const pct = Math.round((completed.size / TOTAL_TOPICS) * 100);
    fill.style.width = pct + "%";
    count.textContent = completed.size;
    if (bar) bar.setAttribute("aria-valuenow", pct);
  }

  updateUI();

  const lessons = document.querySelectorAll(".sliding-window-lesson");
  const observer = new IntersectionObserver(
    (entries) => {
      let changed = false;
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const topic = entry.target.getAttribute("data-topic");
          if (topic && !completed.has(topic)) {
            completed.add(topic);
            changed = true;
          }
        }
      });
      if (changed) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
        } catch {
          /* ignore storage limitations */
        }
        updateUI();
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -20% 0px" },
  );

  lessons.forEach((l) => observer.observe(l));
}

/* ─────────────────────────────────────────────
   Sliding Window Motion Visualizer
   ───────────────────────────────────────────── */

function initSlidingWindowVisualizer() {
  const container = document.getElementById("swArray");

  if (!container) return;

  const playBtn = document.getElementById("swStartBtn");
  const nextBtn = document.getElementById("swNextBtn");
  const resetBtn = document.getElementById("swResetBtn");

  const leftEl = document.getElementById("swLeft");
  const rightEl = document.getElementById("swRight");

  const currentSumEl = document.getElementById("swCurrentSum");
  const bestSumEl = document.getElementById("swBestSum");

  const explanationEl = document.getElementById("swExplanation");

  const arr = [1, 2, 3, 4, 5, 6, 7];
  const windowSize = 3;

  let bestSum = 0;
  let bestWindowStart = 0;
  let currentIndex = 0;
  let timer = null;

  function renderWindow(start) {
    container.innerHTML = "";

    let currentSum = 0;

    arr.forEach((value, index) => {
      const item = document.createElement("div");
      item.className = "array-item";

      if (index >= bestWindowStart && index < bestWindowStart + windowSize) {
        item.classList.add("best-window");
      }
      if (index >= start && index < start + windowSize) {
        item.classList.add("active-window");
        currentSum += value;
      }

      item.textContent = value;
      container.appendChild(item);
    });

    bestSum = Math.max(bestSum, currentSum);
    if (currentSum > bestSum) {
      bestSum = currentSum;
      bestWindowStart = start;
    }

    leftEl.textContent = start;
    rightEl.textContent = start + windowSize - 1;

    currentSumEl.textContent = currentSum;
    bestSumEl.textContent = bestSum;

    if (start === 0) {
      explanationEl.textContent = "Initial window created.";
    } else {
      explanationEl.textContent = `Current window sum = ${currentSum}.
Move both pointers right to check the next window of size ${windowSize}.`;
    }
  }

  function playAnimation() {
    if (timer) return;

    currentIndex = 0;
    bestSum = 0;

    renderWindow(0);

    timer = setInterval(() => {
      currentIndex++;

      if (currentIndex > arr.length - windowSize) {
        clearInterval(timer);
        timer = null;

        explanationEl.textContent =
          "Visualization complete. Best window sum found.";

        return;
      }

      renderWindow(currentIndex);
    }, 1500);
  }

  function resetAnimation() {
    clearInterval(timer);
    timer = null;

    currentIndex = 0;
    bestSum = 0;

    renderWindow(0);

    explanationEl.textContent = "Visualizer reset.";
  }

  playBtn.addEventListener("click", playAnimation);

  resetBtn.addEventListener("click", resetAnimation);

  renderWindow(0);
  function nextStep() {
    if (currentIndex < arr.length - windowSize) {
      currentIndex++;
      renderWindow(currentIndex);
    } else {
      explanationEl.textContent = "Reached the final window.";
    }
  }

  nextBtn.addEventListener("click", nextStep);
}
