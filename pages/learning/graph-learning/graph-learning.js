console.log("GRAPH JS STARTED");
/**
 * graph-learning.js
 * Interactivity for the Graph Learning page:
 *  - Hero typing animation
 *  - Stats counter animation
 *  - Sidebar scroll-spy
 *  - Progress tracking
 *  - Exercise toggle
 *  - Copy code button
 *  - Interactive quiz
 */

function initializeGraphPage() {
  initHeroTyping();
  initStatsAnimation();
  initExerciseToggles();
  initCopyButtons();
  initSidebarSpy();
  initProgressTracker();
  initQuiz();
  initNavbar();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeGraphPage);
} else {
  initializeGraphPage();
}

function initNavbar() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  if (!menuToggle || !navLinks) return;

  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");

    const icon = menuToggle.querySelector("i");
    if (icon) {
      icon.classList.toggle("fa-bars");
      icon.classList.toggle("fa-times");
    }
  });
  // Dropdown menus
  document.querySelectorAll(".dropdown-toggle").forEach((toggle) => {
    toggle.addEventListener("click", (e) => {
      e.preventDefault();

      const parent = toggle.closest(".has-dropdown");

      // close other dropdowns
      document.querySelectorAll(".has-dropdown").forEach((item) => {
        if (item !== parent) {
          item.classList.remove("active");
        }
      });

      parent.classList.toggle("active");
    });
  });

  window.addEventListener("scroll", () => {
    const navbar = document.querySelector(".navbar");
    if (!navbar) return;

    navbar.style.background =
      window.scrollY > 100 ? "rgba(10, 10, 26, 0.95)" : "rgba(10, 10, 26, 0.8)";
  });
}

/* ─────────────────────────────────────────────
   Hero Typing Animation
   ───────────────────────────────────────────── */
function initHeroTyping() {
  const el = document.getElementById("typingTextGraph");
  if (!el) return;

  const words = [
    "Graph Fundamentals",
    "Directed & Undirected Graphs",
    "Breadth-First Search (BFS)",
    "Depth-First Search (DFS)",
    "Shortest Path Algorithms",
    "Real-World Graph Applications",
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

    setTimeout(tick, speed);
  }

  tick();
}

function animateValue(element) {
  const target = Number(element.dataset.target);
  let current = 0;

  const increment = Math.max(1, target / 50);

  function update() {
    current += increment;

    if (current >= target) {
      element.textContent = target;
      return;
    }

    element.textContent = Math.floor(current);
    requestAnimationFrame(update);
  }

  update();
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
  document.querySelectorAll(".graph-exercise-toggle").forEach((btn) => {
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
  document.querySelectorAll(".graph-code-copy").forEach((btn) => {
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
  const links = document.querySelectorAll(".graph-sidebar-nav a");
  const lessons = document.querySelectorAll(".graph-lesson");
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
          `.graph-sidebar-nav a[href="#${id}"]`,
        );
        if (active) active.classList.add("active");
      }
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ─────────────────────────────────────────────
   Progress Tracker
   ───────────────────────────────────────────── */
function initProgressTracker() {
  const STORAGE_KEY = "graph-learning-progress";
  const TOTAL_TOPICS = 8;
  const fill = document.getElementById("progressFill");
  const count = document.getElementById("progressCount");
  const bar = document.querySelector(".graph-progress-bar");

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

  const lessons = document.querySelectorAll(".graph-lesson");
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
        updateUI();
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -20% 0px" },
  );

  lessons.forEach((l) => observer.observe(l));
}

/* ─────────────────────────────────────────────
   Quiz grading logic
   ───────────────────────────────────────────── */
function initQuiz() {
  const submitBtn = document.getElementById("submitQuizBtn");
  const resetBtn = document.getElementById("resetQuizBtn");
  const scoreBanner = document.getElementById("quizScoreBanner");
  const scoreValue = document.getElementById("quizScoreValue");
  const scorePercent = document.getElementById("quizScorePercent");

  const correctAnswers = {
    q1: "b",
    q2: "b",
    q3: "b",
    q4: "b",
    q5: "a",
  };

  const optionCards = document.querySelectorAll(".graph-quiz-option");
  optionCards.forEach((card) => {
    card.addEventListener("click", () => {
      const radio = card.querySelector('input[type="radio"]');
      if (radio.disabled) return;

      radio.checked = true;

      const name = radio.getAttribute("name");
      const parentOptions = document.querySelectorAll(
        `.graph-quiz-option input[name="${name}"]`,
      );
      parentOptions.forEach((o) => {
        o.closest(".graph-quiz-option").classList.remove("selected");
      });

      card.classList.add("selected");
    });
  });

  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      let score = 0;
      let total = Object.keys(correctAnswers).length;
      let allAnswered = true;

      for (let key in correctAnswers) {
        const selectedRadio = document.querySelector(
          `input[name="${key}"]:checked`,
        );
        if (!selectedRadio) {
          allAnswered = false;
          break;
        }
      }

      if (!allAnswered) {
        console.warn("Alert:", "Please answer all questions before submitting!");
        return;
      }

      for (let key in correctAnswers) {
        const correctVal = correctAnswers[key];
        const radios = document.querySelectorAll(`input[name="${key}"]`);

        radios.forEach((r) => {
          r.disabled = true;
          const card = r.closest(".graph-quiz-option");
          card.classList.remove("selected");

          if (r.value === correctVal) {
            card.classList.add("correct");
          } else if (r.checked) {
            card.classList.add("incorrect");
          }
        });

        const selectedRadio = document.querySelector(
          `input[name="${key}"]:checked`,
        );
        const feedback = document.getElementById(`feedback-${key}`);
        const explanation = document.getElementById(`explanation-${key}`);

        if (selectedRadio.value === correctVal) {
          score++;
          if (feedback) {
            feedback.textContent = "✓ Correct Answer!";
            feedback.className = "graph-quiz-feedback correct";
          }
        } else {
          if (feedback) {
            feedback.textContent = "✗ Incorrect Answer.";
            feedback.className = "graph-quiz-feedback incorrect";
          }
        }

        if (explanation) {
          explanation.classList.add("visible");
        }
      }

      const percent = Math.round((score / total) * 100);
      if (scoreValue) scoreValue.textContent = `${score} / ${total}`;
      if (scorePercent) scorePercent.textContent = `(${percent}%)`;
      if (scoreBanner) scoreBanner.classList.add("visible");

      submitBtn.style.display = "none";
      if (resetBtn) resetBtn.style.display = "inline-block";

      scoreBanner.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      const radios = document.querySelectorAll(
        '.graph-quiz-option input[type="radio"]',
      );
      radios.forEach((r) => {
        r.checked = false;
        r.disabled = false;
        const card = r.closest(".graph-quiz-option");
        card.className = "graph-quiz-option";
      });

      const feedbacks = document.querySelectorAll(".graph-quiz-feedback");
      feedbacks.forEach((f) => {
        f.textContent = "";
        f.className = "graph-quiz-feedback";
      });

      const explanations = document.querySelectorAll(".graph-quiz-explanation");
      explanations.forEach((e) => {
        e.classList.remove("visible");
      });

      if (scoreBanner) scoreBanner.classList.remove("visible");
      if (submitBtn) submitBtn.style.display = "inline-block";
      resetBtn.style.display = "none";
    });
  }
}
console.log("GRAPH JS FINISHED");
