document.addEventListener("DOMContentLoaded", () => {
  initHeroTyping();
  initStatsAnimation();
  initExerciseToggles();
  initCopyButtons();
  initSidebarSpy();
  initProgressTracker();
});

function initHeroTyping() {
  const el = document.getElementById("typingTextMatrix");
  if (!el) return;
  const words = ["Row-Column Access", "Spiral Traversal", "Matrix Rotation", "Island Problems", "2D Dynamic Programming", "Graph Adjacency"];
  let wordIdx = 0, charIdx = 0, isDeleting = false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = words[0]; return; }
  function tick() {
    const current = words[wordIdx];
    el.textContent = isDeleting ? current.substring(0, charIdx - 1) : current.substring(0, charIdx + 1);
    isDeleting ? charIdx-- : charIdx++;
    let speed = isDeleting ? 50 : 100;
    if (!isDeleting && charIdx === current.length) { speed = 2000; isDeleting = true; }
    else if (isDeleting && charIdx === 0) { isDeleting = false; wordIdx = (wordIdx + 1) % words.length; speed = 500; }
    requestAnimationFrame(() => setTimeout(tick, speed));
  }
  tick();
}

function initStatsAnimation() {
  const statNumbers = document.querySelectorAll(".stat-number[data-target]");
  if (!statNumbers.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (typeof animateValue === "function") animateValue(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5, rootMargin: "0px 0px -50px 0px" });
  statNumbers.forEach((s) => observer.observe(s));
}

function initExerciseToggles() {
  document.querySelectorAll(".matrix-exercise-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const solution = document.getElementById(btn.getAttribute("aria-controls"));
      if (!solution) return;
      const isVisible = solution.classList.toggle("visible");
      btn.setAttribute("aria-expanded", isVisible);
      btn.textContent = isVisible ? "Hide Solution" : "Show Solution";
    });
  });
}

function initCopyButtons() {
  document.querySelectorAll(".matrix-code-copy").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const code = btn.getAttribute("data-code");
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = code; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
      }
      btn.textContent = "Copied!"; btn.classList.add("copied");
      setTimeout(() => { btn.textContent = "Copy"; btn.classList.remove("copied"); }, 2000);
    });
  });
}

function initSidebarSpy() {
  const links = document.querySelectorAll(".matrix-sidebar-nav a");
  const lessons = document.querySelectorAll(".matrix-lesson");
  if (!links.length || !lessons.length) return;
  const NAV_HEIGHT = 100;
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      let bestId = null, bestDist = Infinity;
      lessons.forEach((lesson) => {
        const dist = Math.abs(lesson.getBoundingClientRect().top - NAV_HEIGHT);
        if (dist < bestDist) { bestDist = dist; bestId = lesson.getAttribute("id"); }
      });
      if (bestId) {
        links.forEach((l) => l.classList.remove("active"));
        const active = document.querySelector(`.matrix-sidebar-nav a[href="#${bestId}"]`);
        if (active) active.classList.add("active");
      }
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function initProgressTracker() {
  const STORAGE_KEY = "matrix-learning-progress";
  const TOTAL_TOPICS = 5;
  const fill = document.getElementById("progressFill");
  const count = document.getElementById("progressCount");
  const bar = document.querySelector(".matrix-progress-bar");
  if (!fill || !count) return;
  let completed = new Set();
  try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); if (Array.isArray(saved)) completed = new Set(saved); } catch {}
  function updateUI() {
    const pct = Math.round((completed.size / TOTAL_TOPICS) * 100);
    fill.style.width = pct + "%"; count.textContent = completed.size;
    if (bar) bar.setAttribute("aria-valuenow", pct);
  }
  updateUI();
  const observer = new IntersectionObserver((entries) => {
    let changed = false;
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const topic = entry.target.getAttribute("data-topic");
        if (topic && !completed.has(topic)) { completed.add(topic); changed = true; }
      }
    });
    if (changed) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed])); } catch {}
      updateUI();
    }
  }, { threshold: 0.15, rootMargin: "0px 0px -20% 0px" });
  document.querySelectorAll(".matrix-lesson").forEach((l) => observer.observe(l));
}