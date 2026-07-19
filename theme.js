// ===== THEME MANAGER — Performance Optimized =====
(function () {
  let cachedNavbar = null;
  let scrollTimeout = null;
  let themeObserver = null;
  let isInitialized = false;
  const SCROLL_THRESHOLD = 100;
  /* ── Scroll-direction auto-hide constants ── */
  const HIDE_THRESHOLD = 120;       /* distance from top below which hiding is active */
  const HIDE_TOLERANCE = 15;        /* minimum delta to detect direction (avoids flicker) */
  let lastScrollY = window.scrollY;
  let mobileMenuOpen = false;       /* prevent hide while mobile nav is open */
  let menuObserver = null;          /* MutationObserver for mobile menu state */
  let menuReadyObserver = null;     /* MutationObserver waiting for #navLinks to appear */

  /**
   * Attach a MutationObserver to the #navLinks element to keep
   * mobileMenuOpen in sync, even when the menu is closed programmatically
   * (e.g., tapping a nav-link, clicking the overlay, pressing Escape).
   */
  function attachMobileMenuObserver() {
    const navLinks = document.getElementById('navLinks');
    if (!navLinks) return;
    menuObserver = new MutationObserver(function () {
      mobileMenuOpen = navLinks.classList.contains('active');
    });
    menuObserver.observe(navLinks, { attributes: true, attributeFilter: ['class'] });
  }

  /**
   * Watch the body for #navLinks to appear (supports dynamic partial loading).
   * Falls back gracefully if the element is already present.
   */
  function watchMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    if (navLinks) {
      attachMobileMenuObserver();
      return;
    }
    /* #navLinks isn't in the DOM yet — wait for it via body observer */
    menuReadyObserver = new MutationObserver(function () {
      if (document.getElementById('navLinks')) {
        menuReadyObserver.disconnect();
        menuReadyObserver = null;
        attachMobileMenuObserver();
      }
    });
    menuReadyObserver.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchMobileMenu);
  } else {
    watchMobileMenu();
  }

  function getNavbar() {
    if (!cachedNavbar) {
      cachedNavbar = document.querySelector('.navbar');
    }
    return cachedNavbar;
  }

  function syncIcons() {
    const toggles = document.querySelectorAll('[data-theme-toggle], #darkModeToggle');
    const isLight = document.documentElement.classList.contains('light-mode');
    toggles.forEach(function (toggle) {
      const icon = toggle.querySelector('i');
      if (!icon) return;
      if (isLight) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
      } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
      }
      toggle.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
    });
  }

  function syncNavbar() {
    const navbar = getNavbar();
    if (!navbar) return;

    const isLight = document.documentElement.classList.contains('light-mode');
    const scrolled = window.scrollY > SCROLL_THRESHOLD;

    if (scrolled) {
      navbar.classList.add('scrolled');
      navbar.style.background = isLight
        ? 'rgba(255, 255, 255, 0.80)'
        : 'rgba(10, 10, 26, 0.80)';
      navbar.style.backdropFilter = 'blur(24px)';
      navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.12)';
    } else {
      navbar.classList.remove('scrolled');
      navbar.style.background = isLight
        ? 'rgba(255, 255, 255, 0.68)'
        : 'rgba(10, 10, 26, 0.65)';
      navbar.style.backdropFilter = 'blur(24px)';
      navbar.style.boxShadow = 'none';
    }

    /* ── Scroll-direction auto-hide ── */
    syncNavbarVisibility(navbar);
  }

  /**
   * Toggles .navbar-hidden based on scroll direction.
   * - Hide when scrolling down past HIDE_THRESHOLD
   * - Show when scrolling up or within HIDE_THRESHOLD from top
   * - Never hide if the mobile menu is open
   */
  function syncNavbarVisibility(navbar) {
    const currentScrollY = window.scrollY;
    const delta = currentScrollY - lastScrollY;
    const isAtTop = currentScrollY <= HIDE_THRESHOLD;

    if (isAtTop) {
      /* Always visible at the top */
      navbar.classList.remove('navbar-hidden');
      lastScrollY = currentScrollY;
    } else if (Math.abs(delta) > HIDE_TOLERANCE) {
      /* Determine direction — only act when delta exceeds tolerance */
      if (!mobileMenuOpen) {
        if (delta > 0) {
          /* Scrolled down — hide navbar */
          navbar.classList.add('navbar-hidden');
        } else {
          /* Scrolled up — reveal navbar */
          navbar.classList.remove('navbar-hidden');
        }
      }
      lastScrollY = currentScrollY;
    }
  }

  function debouncedSyncNavbar() {
    if (scrollTimeout) {
      cancelAnimationFrame(scrollTimeout);
    }
    scrollTimeout = requestAnimationFrame(function () {
      syncNavbar();
      scrollTimeout = null;
    });
  }

  function getStoredTheme() {
    try {
      return localStorage.getItem('theme');
    } catch (error) {
      void 0;
      return null;
    }
  }

  function setStoredTheme(theme) {
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      void 0;
    }
  }

  const TRANSITION_DURATION = 800;

  function toggleTheme() {
    const isLight = document.documentElement.classList.contains('light-mode');
    const newThemeIsLight = !isLight;

    /* find the clicked button — ripple originates from its center */
    var sourceEl = document.activeElement;
    if (!sourceEl || sourceEl === document.body || sourceEl === document.documentElement) {
      sourceEl = document.querySelector('[data-theme-toggle], #darkModeToggle');
    }
    var rect = sourceEl
      ? sourceEl.getBoundingClientRect()
      : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;

    /* radius that covers the farthest viewport corner from the button */
    var dCorner1 = Math.hypot(cx, cy);
    var dCorner2 = Math.hypot(window.innerWidth - cx, cy);
    var dCorner3 = Math.hypot(cx, window.innerHeight - cy);
    var dCorner4 = Math.hypot(window.innerWidth - cx, window.innerHeight - cy);
    var maxRadius = Math.max(dCorner1, dCorner2, dCorner3, dCorner4) + 2;

    /* shared: apply the new theme and sync UI */
    function applyTheme() {
      if (newThemeIsLight) {
        document.documentElement.classList.add('light-mode');
        setStoredTheme('light');
      } else {
        document.documentElement.classList.remove('light-mode');
        setStoredTheme('dark');
      }
      syncIcons();
      syncNavbar();
    }

    /* ── Overlay fallback (used when View Transition API unavailable or throws) ── */
    function runOverlayAnimation() {
      const newColor = newThemeIsLight ? '#ffffff' : '#0a0a1a';

      var overlay = document.createElement('div');
      overlay.setAttribute('aria-hidden', 'true');
      overlay.style.cssText =
        'position:fixed;top:0;left:0;width:100%;height:100%;' +
        'z-index:99999;pointer-events:none;' +
        'background:' + newColor + ';' +
        'will-change:clip-path;' +
        'clip-path:circle(0px at ' + cx + 'px ' + cy + 'px);' +
        'transition:clip-path ' + TRANSITION_DURATION + 'ms cubic-bezier(0.16,1,0.3,1);';
      document.body.appendChild(overlay);

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          overlay.style.clipPath =
            'circle(' + maxRadius + 'px at ' + cx + 'px ' + cy + 'px)';
        });
      });

      setTimeout(function () {
        applyTheme();
        overlay.remove();
      }, TRANSITION_DURATION + 50);
    }

    /* ── View Transition API: outward ripple from click point ── */
    if (document.startViewTransition) {
      document.documentElement.style.setProperty('--ripple-x', cx + 'px');
      document.documentElement.style.setProperty('--ripple-y', cy + 'px');
      document.documentElement.style.setProperty('--ripple-max-r', maxRadius + 'px');

      try {
        var transition = document.startViewTransition(function () {
          applyTheme();
        });
        transition.finished.then(function () {
          document.documentElement.style.removeProperty('--ripple-x');
          document.documentElement.style.removeProperty('--ripple-y');
          document.documentElement.style.removeProperty('--ripple-max-r');
        }).catch(function () {
          /* skipped / aborted — clean up anyway */
          document.documentElement.style.removeProperty('--ripple-x');
          document.documentElement.style.removeProperty('--ripple-y');
          document.documentElement.style.removeProperty('--ripple-max-r');
        });
        return; /* View Transition started successfully — CSS pseudo-elements handle the animation */
      } catch (__ignore__) {
        /* transition already in progress — clean CSS vars, use overlay fallback below */
        document.documentElement.style.removeProperty('--ripple-x');
        document.documentElement.style.removeProperty('--ripple-y');
        document.documentElement.style.removeProperty('--ripple-max-r');
        /* fall through to overlay approach */
      }
      runOverlayAnimation();
      return;
    }

    /* if we reach here, no View Transition API — use overlay */
    runOverlayAnimation();
  }

  function initTheme() {
    if (isInitialized) return;

    const toggles = document.querySelectorAll('[data-theme-toggle], #darkModeToggle');
    if (!toggles.length) {
      setupThemeObserver();
      return;
    }

    const storedTheme = getStoredTheme();
    if (storedTheme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else if (storedTheme === 'dark') {
      document.documentElement.classList.remove('light-mode');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (!prefersDark) {
        document.documentElement.classList.add('light-mode');
      }
    }

    syncIcons();
    syncNavbar();

    toggles.forEach(function (toggle) {
      if (!toggle._listenerAttached) {
        toggle.addEventListener('click', toggleTheme);
        toggle._listenerAttached = true;
      }
    });

    window.addEventListener('scroll', debouncedSyncNavbar, { passive: true });

    window.addEventListener('storage', function (event) {
      if (event.key === 'theme') {
        const isLight = event.newValue === 'light';
        if (isLight) {
          document.documentElement.classList.add('light-mode');
        } else {
          document.documentElement.classList.remove('light-mode');
        }
        syncIcons();
        syncNavbar();
      }
    });

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    function handleSystemChange(e) {
      if (!getStoredTheme()) {
        if (e.matches) {
          document.documentElement.classList.remove('light-mode');
        } else {
          document.documentElement.classList.add('light-mode');
        }
        syncIcons();
        syncNavbar();
      }
    }
    mediaQuery.addEventListener('change', handleSystemChange);

    isInitialized = true;
  }

  function setupThemeObserver() {
    if (themeObserver) {
      themeObserver.disconnect();
      themeObserver = null;
    }

    themeObserver = new MutationObserver(function () {
      const toggles = document.querySelectorAll('[data-theme-toggle], #darkModeToggle');
      if (toggles.length > 0) {
        themeObserver.disconnect();
        themeObserver = null;
        if (!isInitialized) {
          initTheme();
        }
      }
    });

    try {
      themeObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    } catch (error) {
      void 0;
    }
  }

  function cleanupThemeManager() {
    if (scrollTimeout) {
      cancelAnimationFrame(scrollTimeout);
      scrollTimeout = null;
    }

    window.removeEventListener('scroll', debouncedSyncNavbar);

    if (themeObserver) {
      themeObserver.disconnect();
      themeObserver = null;
    }
    if (menuObserver) {
      menuObserver.disconnect();
      menuObserver = null;
    }
    if (menuReadyObserver) {
      menuReadyObserver.disconnect();
      menuReadyObserver = null;
    }

    const toggles = document.querySelectorAll('[data-theme-toggle], #darkModeToggle');
    toggles.forEach(function (toggle) {
      toggle.removeEventListener('click', toggleTheme);
      toggle._listenerAttached = false;
    });

    cachedNavbar = null;
    isInitialized = false;
  }

  function waitForToggle() {
    const toggles = document.querySelectorAll('[data-theme-toggle], #darkModeToggle');
    if (toggles.length > 0) {
      initTheme();
    } else {
      setupThemeObserver();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForToggle);
  } else {
    waitForToggle();
  }

  window.cleanupThemeManager = cleanupThemeManager;
})();
