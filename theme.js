// ===== THEME MANAGER — loaded on every page =====
(function () {

  // ── 1. Apply saved theme IMMEDIATELY (prevents flash on load) ──
  if (localStorage.getItem("darkMode") === "light") {
    document.body.classList.add("light-mode");
  }

  // ── 2. Everything else runs after DOM is ready ──
  function initTheme() {

    const toggles = document.querySelectorAll("#darkModeToggle");
    if (!toggles.length) return;

    // Sync all toggle button icons to match current theme
    function syncIcons() {
      const isLight = document.body.classList.contains("light-mode");
      toggles.forEach(function (toggle) {
        const icon = toggle.querySelector("i");
        if (!icon) return;
        if (isLight) {
          icon.classList.remove("fa-moon");
          icon.classList.add("fa-sun");
        } else {
          icon.classList.remove("fa-sun");
          icon.classList.add("fa-moon");
        }
      });
    }

    // Sync navbar background to match current theme + scroll position
    function syncNavbar() {
      const navbar = document.querySelector(".navbar");
      if (!navbar) return;
      const isLight = document.body.classList.contains("light-mode");
      const scrolled = window.scrollY > 100;
      navbar.style.background = isLight
        ? ("rgba(255, 255, 255, " + (scrolled ? "0.98" : "0.85") + ")")
        : ("rgba(10, 10, 26, " + (scrolled ? "0.95" : "0.85") + ")");
    }

    // Apply icons on page load
    syncIcons();

    // Apply navbar color on page load
    syncNavbar();

    // Handle toggle click
    toggles.forEach(function (toggle) {
      toggle.addEventListener("click", function () {
        document.body.classList.toggle("light-mode");
        const isLight = document.body.classList.contains("light-mode");
        localStorage.setItem("darkMode", isLight ? "light" : "dark");
        syncIcons();
        syncNavbar();
      });
    });

    // Keep navbar in sync on scroll
    window.addEventListener("scroll", syncNavbar);
  }

  // Run after DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTheme);
  } else {
    initTheme();
  }

})();