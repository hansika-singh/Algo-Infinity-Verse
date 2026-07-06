/**
 * computer-architecture.js
 * Interactivity for the Computer Architecture Learning page:
 *  - Hero typing animation
 *  - Stats counter animation (uses global animateValue from script.js)
 *  - Sidebar scroll-spy (active link tracking)
 *  - Progress bar (tracks completed topics via localStorage)
 *  - Exercise toggle (show/hide solutions)
 *  - Copy code button
 *  - Interactive Computer Architecture Quiz
 */

document.addEventListener("DOMContentLoaded", () => {
  initHeroTyping();
  initStatsAnimation();
  initExerciseToggles();
  initCopyButtons();
  initSidebarSpy();
  initProgressTracker();
  initQuiz();
});

/* ─────────────────────────────────────────────
   Hero Typing Animation
   ───────────────────────────────────────────── */
function initHeroTyping() {
  const el = document.getElementById("typingTextCa");
  if (!el) return;

  const words = [
    "Von Neumann Model",
    "Fetch-Decode-Execute",
    "RISC vs CISC Design",
    "Cache & RAM Hierarchy",
    "Instruction Pipeline",
    "System Bus Operations",
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
  document.querySelectorAll(".ca-exercise-toggle").forEach((btn) => {
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
  document.querySelectorAll(".ca-code-copy").forEach((btn) => {
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
  const links = document.querySelectorAll(".ca-sidebar-nav a");
  const lessons = document.querySelectorAll(".ca-lesson");
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
          `.ca-sidebar-nav a[href="#${id}"]`
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
  const STORAGE_KEY = "ca-learning-progress";
  const TOTAL_TOPICS = 12;
  const fill = document.getElementById("progressFill");
  const count = document.getElementById("progressCount");
  const bar = document.querySelector(".ca-progress-bar");

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

  const lessons = document.querySelectorAll(".ca-lesson");
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
   Quiz grading logic
   ───────────────────────────────────────────── */
function initQuiz() {
  const submitBtn = document.getElementById("submitQuizBtn");
  const resetBtn = document.getElementById("resetQuizBtn");
  const scoreBanner = document.getElementById("quizScoreBanner");
  const scoreValue = document.getElementById("quizScoreValue");
  const scorePercent = document.getElementById("quizScorePercent");

  const correctAnswers = {
    q1: "bus",
    q2: "l1",
    q3: "cu",
    q4: "interrupts",
    q5: "fetch",
  };

  const optionCards = document.querySelectorAll(".ca-quiz-option");
  optionCards.forEach((card) => {
    card.addEventListener("click", () => {
      const radio = card.querySelector('input[type="radio"]');
      if (radio.disabled) return;

      radio.checked = true;

      const name = radio.getAttribute("name");
      const parentOptions = document.querySelectorAll(`.ca-quiz-option input[name="${name}"]`);
      parentOptions.forEach((o) => {
        o.closest(".ca-quiz-option").classList.remove("selected");
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
        const selectedRadio = document.querySelector(`input[name="${key}"]:checked`);
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
          const card = r.closest(".ca-quiz-option");
          card.classList.remove("selected");

          if (r.value === correctVal) {
            card.classList.add("correct");
          } else if (r.checked) {
            card.classList.add("incorrect");
          }
        });

        const selectedRadio = document.querySelector(`input[name="${key}"]:checked`);
        const feedback = document.getElementById(`feedback-${key}`);
        const explanation = document.getElementById(`explanation-${key}`);

        if (selectedRadio.value === correctVal) {
          score++;
          if (feedback) {
            feedback.textContent = "✓ Correct Answer!";
            feedback.className = "ca-quiz-feedback correct";
          }
        } else {
          if (feedback) {
            feedback.textContent = `✗ Incorrect. Correct: ${correctVal.toUpperCase()}`;
            feedback.className = "ca-quiz-feedback incorrect";
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
      const radios = document.querySelectorAll('.ca-quiz-option input[type="radio"]');
      radios.forEach((r) => {
        r.checked = false;
        r.disabled = false;
        const card = r.closest(".ca-quiz-option");
        card.className = "ca-quiz-option";
      });

      const feedbacks = document.querySelectorAll(".ca-quiz-feedback");
      feedbacks.forEach((f) => {
        f.textContent = "";
        f.className = "ca-quiz-feedback";
      });

      const explanations = document.querySelectorAll(".ca-quiz-explanation");
      explanations.forEach((e) => {
        e.classList.remove("visible");
      });

      if (scoreBanner) scoreBanner.classList.remove("visible");
      if (submitBtn) submitBtn.style.display = "inline-block";
      resetBtn.style.display = "none";
    });
  }
}
