document.addEventListener("DOMContentLoaded", () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  initHeroTyping();
  initStatsAnimation();
  initExerciseToggles();
  initCopyButtons();
  initSidebarSpy();
  initProgressTracker();
});

/* ─── Loading Screen ─── */
function initLoadingScreen() {
  setTimeout(() => {
    const s = document.getElementById("loading-screen");
    if (s) s.classList.add("hidden");
  }, 2000);
}

/* ─── Scroll Top ─── */
function initScrollTop() {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;
  window.addEventListener("scroll", () => {
    btn.classList.toggle("visible", window.scrollY > 400);
  });
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ─── Navbar ─── */
function initNavbar() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks   = document.getElementById("navLinks");
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
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    overlay.classList.toggle("active", isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
    const icon = menuToggle.querySelector("i");
    if (icon) {
      icon.classList.toggle("fa-bars", !isOpen);
      icon.classList.toggle("fa-times", isOpen);
    }
  };

  menuToggle.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(); });
  overlay.addEventListener("click", () => toggleMenu(false));
  navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => toggleMenu(false)));

  const isMobile = () => window.matchMedia("(max-width: 1024px)").matches;

  document.querySelectorAll(".dropdown-toggle").forEach((btn) => {
    const parent = btn.closest(".has-dropdown");
    const menu   = parent && parent.querySelector(".dropdown-menu");
    if (!parent || !menu) return;
    let timer;
    parent.addEventListener("mouseenter", () => {
      if (!isMobile()) { clearTimeout(timer); parent.classList.add("open"); btn.setAttribute("aria-expanded", "true"); }
    });
    parent.addEventListener("mouseleave", () => {
      if (!isMobile()) { timer = setTimeout(() => { parent.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }, 250); }
    });
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = parent.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(isOpen));
    });

    btn.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        parent.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
        btn.focus();
      }
    });
  });

  window.addEventListener("resize", () => {
    if (!isMobile()) {
      toggleMenu(false);
      document.querySelectorAll(".has-dropdown.open").forEach((el) => el.classList.remove("open"));
      document.querySelectorAll(".dropdown-toggle").forEach((btn) => btn.setAttribute("aria-expanded", "false"));
    }
  });

  window.addEventListener("scroll", () => {
    const nav = document.querySelector(".navbar");
    if (nav) nav.style.background = window.scrollY > 100 ? "rgba(10,10,26,0.95)" : "rgba(10,10,26,0.85)";
  });
}

/* ─── Hero Typing Animation ─── */
function initHeroTyping() {
  const el = document.getElementById("typingTextFenwick");
  if (!el) return;

  const words = [
    "Prefix Sum Queries",
    "Point Updates",
    "Inversion Count",
    "Range Sum Queries",
    "O(log n) Operations",
    "Competitive Programming",
  ];

  let wordIdx = 0, charIdx = 0, isDeleting = false;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.textContent = words[0];
    return;
  }

  function tick() {
    const current = words[wordIdx];
    el.textContent = isDeleting
      ? current.substring(0, charIdx - 1)
      : current.substring(0, charIdx + 1);

    isDeleting ? charIdx-- : charIdx++;

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

/* ─── Stats Counter Animation ─── */
function initStatsAnimation() {
  const statNumbers = document.querySelectorAll(".stat-number[data-target]");
  if (!statNumbers.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (typeof animateValue === "function") animateValue(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  statNumbers.forEach((s) => observer.observe(s));
}

/* ─── Exercise Toggles ─── */
function initExerciseToggles() {
  document.querySelectorAll(".js-exercise-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("aria-controls");
      const solution = document.getElementById(targetId);
      if (!solution) return;
      const isVisible = solution.classList.toggle("visible");
      btn.setAttribute("aria-expanded", String(isVisible));
      btn.textContent = isVisible ? "Hide Solution" : "Show Solution";
    });
  });
}

/* ─── Copy Buttons ─── */
function initCopyButtons() {
  document.querySelectorAll(".js-code-copy").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const code = btn.getAttribute("data-code");
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = code;
        ta.style.cssText = "position:fixed;opacity:0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      btn.textContent = "Copied!";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.textContent = "Copy";
        btn.classList.remove("copied");
      }, 2000);
    });
  });
}

/* ─── Sidebar Scroll-Spy ─── */
function initSidebarSpy() {
  const links   = document.querySelectorAll(".js-sidebar-nav a");
  const lessons = document.querySelectorAll(".js-lesson");
  if (!links.length || !lessons.length) return;

  const NAV_HEIGHT = 80;
  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      let bestId = null, bestDist = Infinity;
      lessons.forEach((lesson) => {
        const dist = Math.abs(lesson.getBoundingClientRect().top - NAV_HEIGHT);
        if (dist < bestDist) { bestDist = dist; bestId = lesson.id; }
      });
      if (bestId) {
        links.forEach((l) => l.classList.remove("active"));
        const active = document.querySelector(`.js-sidebar-nav a[href="#${bestId}"]`);
        if (active) active.classList.add("active");
      }
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ─── Progress Tracker ─── */
function initProgressTracker() {
  const STORAGE_KEY  = "fenwick-tree-learning-progress";
  const TOTAL_TOPICS = 8;
  const fill  = document.getElementById("progressFill");
  const count = document.getElementById("progressCount");
  const bar   = document.querySelector(".js-progress-bar");

  if (!fill || !count) return;

  let completed = new Set();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) completed = new Set(saved);
  } catch { /* ignore */ }

  function updateUI() {
    const pct = Math.round((completed.size / TOTAL_TOPICS) * 100);
    fill.style.width = pct + "%";
    count.textContent = completed.size;
    if (bar) bar.setAttribute("aria-valuenow", String(pct));
  }

  updateUI();

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
    { threshold: 0.15, rootMargin: "0px 0px -20% 0px" }
  );

  document.querySelectorAll(".js-lesson").forEach((l) => observer.observe(l));
}