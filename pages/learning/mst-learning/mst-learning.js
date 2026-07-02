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
    btn.classList.toggle("visible", window.scrollY > 400),
  );
  btn.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" }),
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
      open !== undefined ? open : !navLinks.classList.contains("active");
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
  navLinks
    .querySelectorAll("a")
    .forEach((a) => a.addEventListener("click", () => toggleMenu(false)));
  const isMobile = () => window.matchMedia("(max-width: 1024px)").matches;
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
        const o = parent.classList.toggle("open");
        toggle.setAttribute("aria-expanded", o);
      }
    });
  });
  window.addEventListener("scroll", () => {
    const nav = document.querySelector(".navbar");
    if (nav)
      nav.style.background =
        window.scrollY > 100 ? "rgba(10,10,26,0.95)" : "rgba(10,10,26,0.85)";
  });
}

function initHeroTyping() {
  const el = document.getElementById("typingTextMST");
  if (!el) return;
  const words = [
    "Minimum Spanning Tree",
    "Prim's Algorithm",
    "Kruskal's Algorithm",
    "Union Find (DSU)",
    "Graph Optimization",
    "Network Design",
  ];
  let wi = 0,
    ci = 0,
    del = false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.textContent = words[0];
    return;
  }
  function tick() {
    const cur = words[wi];
    el.textContent = del ? cur.substring(0, ci - 1) : cur.substring(0, ci + 1);
    del ? ci-- : ci++;
    let speed = del ? 50 : 100;
    if (!del && ci === cur.length) {
      speed = 2000;
      del = true;
    } else if (del && ci === 0) {
      del = false;
      wi = (wi + 1) % words.length;
      speed = 500;
    }
    requestAnimationFrame(() => setTimeout(tick, speed));
  }
  tick();
}

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
    { threshold: 0.5 },
  );
  statNumbers.forEach((s) => observer.observe(s));
}

function initExerciseToggles() {
  document.querySelectorAll(".js-exercise-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sol = document.getElementById(btn.getAttribute("aria-controls"));
      if (!sol) return;
      const visible = sol.classList.toggle("visible");
      btn.setAttribute("aria-expanded", visible);
      btn.textContent = visible ? "Hide Solution" : "Show Solution";
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
        const ta = document.createElement("textarea");
        ta.value = code;
        ta.style.cssText = "position:fixed;opacity:0";
        document.body.appendChild(ta);
        ta.select();
        const success = document.execCommand("copy");
        document.body.removeChild(ta);
        if (success) {
          btn.textContent = "Copied!";
          btn.classList.add("copied");
          setTimeout(() => {
            btn.textContent = "Copy";
            btn.classList.remove("copied");
          }, 2000);
        } else {
          btn.textContent = "Failed";
          setTimeout(() => {
            btn.textContent = "Copy";
          }, 2000);
        }
      }
    });
  });
}

function initSidebarSpy() {
  const links = document.querySelectorAll(".js-sidebar-nav a");
  const lessons = document.querySelectorAll(".js-lesson");
  if (!links.length || !lessons.length) return;
  const NAV_HEIGHT = 80;
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      let bestId = null,
        bestDist = Infinity;
      lessons.forEach((l) => {
        const dist = Math.abs(l.getBoundingClientRect().top - NAV_HEIGHT);
        if (dist < bestDist) {
          bestDist = dist;
          bestId = l.id;
        }
      });
      if (bestId) {
        links.forEach((l) => l.classList.remove("active"));
        const active = document.querySelector(
          `.js-sidebar-nav a[href="#${bestId}"]`,
        );
        if (active) active.classList.add("active");
      }
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function initProgressTracker() {
  const STORAGE_KEY = "mst-learning-progress";
  const TOTAL_TOPICS = 10;
  const fill = document.getElementById("progressFill");
  const count = document.getElementById("progressCount");
  const bar = document.querySelector(".js-progress-bar");
  if (!fill || !count) return;

  let completed = new Set();

  function updateUI() {
    const pct = Math.round((completed.size / TOTAL_TOPICS) * 100);
    fill.style.width = pct + "%";
    count.textContent = completed.size;
    if (bar) bar.setAttribute("aria-valuenow", pct);
  }

  updateUI();

  let ready = false;

  const observer = new IntersectionObserver(
    (entries) => {
      if (!ready) return;
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
        } catch (e) {
          console.warn("Could not save progress:", e);
        }
        updateUI();
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -20% 0px" },
  );

  document.querySelectorAll(".js-lesson").forEach((l) => observer.observe(l));

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      ready = true;
    });
  });
}
