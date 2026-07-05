// Everything else on the page that triggers a meaningful action requires the user to be logged in.

(function () {
  "use strict";
  function isAuthenticated() {
    return !!(window.algoAuth && window.algoAuth.authenticated);
  }

  function authUrl(path) {
    if (location.protocol === "file:") {
      return path.endsWith(".html") ? path : `${path}.html`;
    }
    return path;
  }
  function currentPageUrl() {
    return `${location.pathname}${location.search}${location.hash}`;
  }

  //Modal management
  const modal = document.getElementById("authGateModal");
  const loginBtn = document.getElementById("authGateLoginBtn");
  const signupBtn = document.getElementById("authGateSignupBtn");
  const subtitle = document.getElementById("authGateSubtitle");

  function openAuthGate(customMessage) {
    if (!modal) return;

    // Update subtitle text if a context-specific message is provided
    if (subtitle && customMessage) {
      subtitle.textContent = customMessage;
      } else if (subtitle) {
        subtitle.textContent =
          "Continue as guest to explore, or sign in to save your progress.";
      }

    // Build ?next= param so user lands back here after login
    const next = encodeURIComponent(currentPageUrl());
    if (loginBtn) loginBtn.href = `${authUrl("/login")}?next=${next}`;
    if (signupBtn) signupBtn.href = `${authUrl("/signup")}?next=${next}`;

    // Re-trigger the slide-in animation every open
    const content = modal.querySelector(".auth-gate-modal-content");
    if (content) {
      content.style.animation = "none";
      void content.offsetWidth;
      content.style.animation = "";
    }

    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeAuthGate() {
    if (!modal) return;
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  }

  const closeBtn = document.getElementById("authGateModalClose");
  const dismissBtn = document.getElementById("authGateDismiss");
  const guestBtn = document.getElementById("authGateGuestBtn");
  if (closeBtn) closeBtn.addEventListener("click", closeAuthGate);
  if (dismissBtn) dismissBtn.addEventListener("click", closeAuthGate);
  if (guestBtn) {
    guestBtn.addEventListener("click", async () => {
      guestBtn.disabled = true;
      guestBtn.innerHTML = '<span class="btn-spinner"></span> Entering...';
      try {
        const response = await fetch("/api/guest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const payload = await response.json().catch(() => ({}));
        if (response.ok) {
          window.algoAuth = { authenticated: true, user: payload.user };
          closeAuthGate();
          if (lastMatchedProtected) {
            lastMatchedProtected.click();
            lastMatchedProtected = null;
          }
        } else {
          const text = JSON.stringify(payload);
          console.warn("Guest auth failed:", response.status, text);
          alert("Guest login failed: " + (payload.error || text || response.status));
        }
      } catch (error) {
        console.error("Guest auth error:", error);
        alert("Guest login failed: " + (error.message || "network error"));
      } finally {
        guestBtn.disabled = false;
        guestBtn.innerHTML = '<i class="fas fa-user-astronaut"></i> Continue as Guest';
      }
    });
  }
  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeAuthGate();
    });
  }

  // Close on Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal && modal.classList.contains("active")) {
      closeAuthGate();
    }
  });

  // Selector helpers
  function closestMatch(el, selector, maxDepth = 8) {
    let node = el;
    let depth = 0;
    while (node && depth < maxDepth) {
      if (node.matches && node.matches(selector)) return node;
      node = node.parentElement;
      depth++;
    }
    return null;
  }

  // Protected element rules
  // If the clicked element matches the selector, auth is required.
  const PROTECTED_RULES = [
    {
      selector: ".hero-buttons .btn-primary",
      message: "Login to start practising problems and track your progress.",
    },
    {
      selector: ".nav-cta-btn",
      message: "Login to start your DSA learning journey.",
    },
    {
      selector: ".nav-cta a",
      message: "Login to start your learning journey.",
    },
    {
      selector: "#totdBtn",
      message:
        "Login to explore today's topic, earn XP, and track your streak.",
    },
    {
      selector: ".topic-card",
      message: "Login to explore DSA topics, take quizzes, and earn XP.",
    },
    {
      selector: ".problem-card",
      message: "Login to open the code editor and solve this problem.",
    },
    {
      selector: ".favorite-btn",
      message: "Login to save your favourite problems.",
    },
    {
      selector: ".notes-btn",
      message: "Login to write and save notes for this problem.",
    },
    {
      selector: ".filter-btn",
      message: "Login to filter and track your practice problems.",
    },
    {
      selector: ".quiz-card",
      message: "Login to take quizzes, earn XP, and track your best scores.",
    },
    {
      selector: ".start-quiz-btn",
      message: "Login to take quizzes and earn XP.",
    },
    {
      selector: ".profile-edit-btn",
      message: "Login to customise your profile.",
    },
    {
      selector: "#startPracticeBtn",
      message: "Login to start practising and track your progress.",
    },
    {
      selector:
        ".roadmap-timeline .btn, #basicRoadmapContainer .btn, #advancedRoadmapContainer .btn",
      message: "Login to access roadmap steps, quizzes, and challenges.",
    },
    {
      selector: ".interview-card button.card-btn",
      message: "Login to access Technical Interview practice.",
    },
    {
      selector: ".dashboard-card a[href='/pages/career/resume/resume.html']",
      message: "Login to view your coding resume.",
    },
  ];

  // Elements ALWAYS allowed without auth (used as early-exit checks in the handler)
  const ALWAYS_ALLOWED_SELECTORS = [
    ".hero-buttons .btn-secondary",
    ".nav-auth-link",
    "#navLoginBtn",
    "#navSignupBtn",
    "[data-auth-logout]",
    ".nav-logo",
    ".nav-link[href='#home']",
    "#darkModeToggle",
    "#menuToggle",
    "#scrollTopBtn",
    "#backToTopBtn",
    ".back-to-top",
    ".modal-close",
    "#authGateModalClose",
    "#authGateDismiss",
    "#authGateLoginBtn",
    "#authGateSignupBtn",
    "#chatbotToggle",
    "#chatbotClose",
    "#chatbotSend",
    ".quick-q",
    ".footer-question",
    ".dropdown-toggle",
    ".dropdown-item",
    ".newsletter-form button",
    ".roadmap-tab",
    "#clearSearchBtn",
    "#searchInput",
    "#authGateModal",
    ".auth-gate-modal-content",
    ".interview-card a.card-btn",
  ];

  // Main click interceptor
  let lastMatchedProtected = null;

  document.addEventListener(
    "click",
    function (e) {
      // If already authenticated, let everything pass through
      if (isAuthenticated()) return;
      const target = e.target;

      // 1. Check if click is on (or inside) an always-allowed element
      for (const sel of ALWAYS_ALLOWED_SELECTORS) {
        if (closestMatch(target, sel)) return; // allow
      }

      // 2. Check if the click is inside the auth-gate modal itself
      if (modal && modal.contains(target)) return;
      for (const rule of PROTECTED_RULES) {
        const matched = closestMatch(target, rule.selector);
        if (matched) {
          e.preventDefault();
          e.stopImmediatePropagation();
          lastMatchedProtected = matched;
          matched.classList.remove("auth-gate-shake");
          void matched.offsetWidth;
          matched.classList.add("auth-gate-shake");
          matched.addEventListener(
            "animationend",
            () => matched.classList.remove("auth-gate-shake"),
            { once: true }
          );
          openAuthGate(rule.message);
          return;
        }
      }
    },
    true
  );

  // Guard hash-based navigation to #dashboard / #profile (auth.js already does this, but in case there's a timing gap)

  function guardHashNav() {
    if (isAuthenticated()) return;
    const privateHashes = new Set(["#dashboard", "#profile"]);
    if (privateHashes.has(location.hash)) {
      openAuthGate("Login to view your dashboard and profile.");
    }
  }
  window.addEventListener("hashchange", guardHashNav);

  // Expose open/close for external callers
  window.authGate = {
    open: openAuthGate,
    close: closeAuthGate,
    isAuthenticated,
  };
})();
