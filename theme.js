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

  function toggleTheme() {
    const isLight = document.documentElement.classList.contains('light-mode');
    if (isLight) {
      document.documentElement.classList.remove('light-mode');
      setStoredTheme('dark');
    } else {
      document.documentElement.classList.add('light-mode');
      setStoredTheme('light');
    }
    syncIcons();
    syncNavbar();
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