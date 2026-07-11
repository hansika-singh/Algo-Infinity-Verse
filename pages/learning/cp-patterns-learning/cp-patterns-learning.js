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

function initLoadingScreen() {
  setTimeout(() => {
    const s = document.getElementById("loading-screen");
    if (s) s.classList.add("hidden");
  }, 2000);
}

function initScrollTop() {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;

  window.addEventListener("scroll", () =>
    btn.classList.toggle("visible", window.scrollY > 400)
  );

  btn.addEventListener("click", () =>
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  );
}

function initNavbar() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  if (!menuToggle || !navLinks) return;

  let overlay = document.querySelector(".nav-overlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "nav-overlay";
    document.body.appendChild(overlay);
  }

  const toggleMenu = (open) => {
    const isOpen =
      open !== undefined
        ? open
        : !navLinks.classList.contains("active");

    navLinks.classList.toggle("active", isOpen);
    menuToggle.setAttribute("aria-expanded", isOpen);

    overlay.classList.toggle("active", isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";

    const icon = menuToggle.querySelector("i");

    if (icon) {
      icon.classList.toggle("fa-bars", !isOpen);
      icon.classList.toggle("fa-times", isOpen);
    }
  };

  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  overlay.addEventListener("click", () => toggleMenu(false));

  navLinks.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => toggleMenu(false));
  });

  const isMobile = () =>
    window.matchMedia("(max-width: 1024px)").matches;

  document.querySelectorAll(".dropdown-toggle").forEach((toggle) => {
    const parent = toggle.closest(".has-dropdown");
    const menu = parent?.querySelector(".dropdown-menu");

    if (!parent || !menu) return;

    let t;

    parent.addEventListener("mouseenter", () => {
      if (!isMobile()) {
        clearTimeout(t);
        parent.classList.add("open");
        toggle.setAttribute("aria-expanded", "true");
      }
    });

    parent.addEventListener("mouseleave", () => {
      if (!isMobile()) {
        t = setTimeout(() => {
          parent.classList.remove("open");
          toggle.setAttribute("aria-expanded", "false");
        }, 250);
      }
    });

    toggle.addEventListener("click", (e) => {
      if (isMobile()) {
        e.preventDefault();
        e.stopPropagation();

        const open = parent.classList.toggle("open");
        toggle.setAttribute("aria-expanded", open);
      }
    });
  });

  window.addEventListener("scroll", () => {
    const nav = document.querySelector(".navbar");

    if (nav) {
      nav.style.background =
        window.scrollY > 100
          ? "rgba(10,10,26,0.95)"
          : "rgba(10,10,26,0.85)";
    }
  });
}

function initHeroTyping() {
  const el = document.getElementById("typingTextCPPatterns");

  if (!el) return;

  const words = [
    "Two Pointers",
    "Sliding Window",
    "Prefix Sum",
    "Binary Search on Answer",
    "Competitive Programming",
    "Interview Patterns"
  ];

  let wi = 0;
  let ci = 0;
  let deleting = false;

  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    el.textContent = words[0];
    return;
  }

  function tick() {
    const current = words[wi];

    el.textContent = deleting
      ? current.substring(0, ci - 1)
      : current.substring(0, ci + 1);

    deleting ? ci-- : ci++;

    let speed = deleting ? 50 : 100;

    if (!deleting && ci === current.length) {
      speed = 2000;
      deleting = true;
    } else if (deleting && ci === 0) {
      deleting = false;
      wi = (wi + 1) % words.length;
      speed = 500;
    }

    requestAnimationFrame(() => setTimeout(tick, speed));
  }

  tick();
}

function initStatsAnimation() {
  const statNumbers = document.querySelectorAll(
    ".stat-number[data-target]"
  );

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
    { threshold: 0.5 }
  );

  statNumbers.forEach((s) => observer.observe(s));
}

function initExerciseToggles() {
  document.querySelectorAll(".js-exercise-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const solution = document.getElementById(
        btn.getAttribute("aria-controls")
      );

      if (!solution) return;

      const visible = solution.classList.toggle("visible");

      btn.setAttribute("aria-expanded", visible);
      btn.textContent = visible
        ? "Hide Solution"
        : "Show Solution";
    });
  });
}

function initCopyButtons() {
  document.querySelectorAll(".hl-code-copy").forEach((btn) => {
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
        void 0;
      }
    });
  });
}

function initSidebarSpy() {
  const links = document.querySelectorAll(".js-sidebar-nav a");
  const lessons = document.querySelectorAll(".js-lesson");

  if (!links.length || !lessons.length) return;

  const NAV_HEIGHT = 80;

  function updateActiveLink() {
    let bestId = null;
    let bestDist = Infinity;

    lessons.forEach((lesson) => {
      const dist = Math.abs(
        lesson.getBoundingClientRect().top - NAV_HEIGHT
      );

      if (dist < bestDist) {
        bestDist = dist;
        bestId = lesson.id;
      }
    });

    links.forEach((link) => link.classList.remove("active"));

    const active = document.querySelector(
      `.js-sidebar-nav a[href="#${bestId}"]`
    );

    if (active) active.classList.add("active");
  }

  window.addEventListener("scroll", updateActiveLink);
  updateActiveLink();
}

function initProgressTracker() {
  const STORAGE_KEY = "cp-patterns-learning-progress";

  const TOTAL_TOPICS = 8;

  const fill = document.getElementById("progressFill");
  const count = document.getElementById("progressCount");
  const bar = document.querySelector(".js-progress-bar");

  if (!fill || !count) return;

  let completed = new Set();

  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY)
    );

    if (Array.isArray(saved)) {
      completed = new Set(saved);
    }
  } catch {}

  function updateUI() {
    const percentage = Math.round(
      (completed.size / TOTAL_TOPICS) * 100
    );

    fill.style.width = percentage + "%";
    count.textContent = completed.size;

    if (bar) {
      bar.setAttribute("aria-valuenow", percentage);
    }
  }

  updateUI();

  const observer = new IntersectionObserver(
    (entries) => {
      let changed = false;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const topic =
            entry.target.getAttribute("data-topic");

          if (topic && !completed.has(topic)) {
            completed.add(topic);
            changed = true;
          }
        }
      });

      if (changed) {
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify([...completed])
          );
        } catch (e) {
          void 0;
        }

        updateUI();
      }
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -20% 0px",
    }
  );

  document
    .querySelectorAll(".js-lesson")
    .forEach((lesson) => observer.observe(lesson));
}