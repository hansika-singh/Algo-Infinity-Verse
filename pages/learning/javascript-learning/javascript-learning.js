/**
 * javascript-learning.js
 * Interactivity for the JavaScript Learning page:
 *  - Hero typing animation
 *  - Stats counter animation (uses global animateValue from script.js)
 *  - Sidebar scroll-spy (active link tracking)
 *  - Progress bar (tracks completed topics via localStorage)
 *  - Exercise toggle (show/hide solutions)
 *  - Copy code button
 *  - Interactive Quiz
 */

import { initQuiz } from '../../../modules/quiz.js';

document.addEventListener("DOMContentLoaded", () => {
  initHeroTyping();
  initStatsAnimation();
  initExerciseToggles();
  initCopyButtons();
  initSidebarSpy();
  initProgressTracker();
  initJSQuiz();
});

/* ─────────────────────────────────────────────
   Hero Typing Animation
   ───────────────────────────────────────────── */
function initHeroTyping() {
  const el = document.getElementById("typingTextJavascript");
  if (!el) return;

  const words = [
    "Variables",
    "Data Types",
    "Operators",
    "Conditionals",
    "Loops",
    "Functions",
    "Arrays & Objects",
    "DOM Manipulation",
    "Event Handling",
  ];

  let wordIdx = 0;
  let charIdx = 0;
  let isDeleting = false;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
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
          // animateValue is defined in script.js (global)
          if (typeof animateValue === "function") {
            animateValue(entry.target);
          }
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5, rootMargin: "0px 0px -50px 0px" }
  );

  statNumbers.forEach((s) => observer.observe(s));
}

/* ─────────────────────────────────────────────
   Exercise Show/Hide Toggle
   ───────────────────────────────────────────── */
function initExerciseToggles() {
  document.querySelectorAll(".js-exercise-toggle").forEach((btn) => {
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
  document.querySelectorAll(".js-code-copy").forEach((btn) => {
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
   Highlights the nav link for the section closest to the viewport top.
   Uses a scroll listener for reliable, real-time tracking.
   ───────────────────────────────────────────── */
function initSidebarSpy() {
  const links = document.querySelectorAll(".js-sidebar-nav a");
  const lessons = document.querySelectorAll(".js-lesson");
  if (!links.length || !lessons.length) return;

  const NAV_HEIGHT = 80; // offset for fixed navbar

  function getActiveId() {
    let bestId = null;
    let bestDist = Infinity;

    lessons.forEach((lesson) => {
      const rect = lesson.getBoundingClientRect();
      // Distance from the top of the lesson to the scroll position + nav offset
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
          `.js-sidebar-nav a[href="#${id}"]`
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
   Tracks which topics the user has scrolled past.
   Stored in localStorage for persistence.
   ───────────────────────────────────────────── */
function initProgressTracker() {
  const STORAGE_KEY = "javascript-learning-progress";
  const TOTAL_TOPICS = 13;
  const fill = document.getElementById("progressFill");
  const count = document.getElementById("progressCount");
  const bar = document.querySelector(".js-progress-bar");

  if (!fill || !count) return;

  // Load saved progress
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

  // Observe lessons entering viewport
  const lessons = document.querySelectorAll(".js-lesson");
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
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify([...completed])
        );
        updateUI();
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -20% 0px" }
  );

  lessons.forEach((l) => observer.observe(l));
}

/* ─────────────────────────────────────────────
   Interactive Knowledge Check Quiz
   ───────────────────────────────────────────── */
function initJSQuiz() {
  const jsQuestions = [
    {
      question: "Which of the following keywords is used to declare an immutable variable in modern JavaScript?",
      options: ["var", "let", "const", "static"],
      answer: "const",
      explanation: "The 'const' keyword declares a block-scoped, immutable variable."
    },
    {
      question: "What will `typeof null` evaluate to in JavaScript?",
      options: ["\"null\"", "\"undefined\"", "\"object\"", "\"boolean\""],
      answer: "\"object\"",
      explanation: "Due to a historical quirk in JavaScript, `typeof null` returns 'object' instead of 'null'."
    },
    {
      question: "Which operator performs a strict equality comparison (checking both value and type)?",
      options: ["==", "===", "=", "!=="],
      answer: "===",
      explanation: "The '===' operator is the strict equality operator, checking both type and value."
    },
    {
      question: "How do you add an element to the end of a JavaScript array?",
      options: ["array.unshift()", "array.pop()", "array.add()", "array.push()"],
      answer: "array.push()",
      explanation: "The push() method adds one or more elements to the end of an array."
    },
    {
      question: "Which method is used to attach an event handler to a DOM element?",
      options: ["attachEvent()", "listenEvent()", "addEventListener()", "onEvent()"],
      answer: "addEventListener()",
      explanation: "The modern and standard way to attach event handlers is using addEventListener()."
    }
  ];

  initQuiz({
    containerId: "js-quiz-container",
    questions: jsQuestions
  });
}
