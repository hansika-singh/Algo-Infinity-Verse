let scrollPosition = 0;
let navbarInitialized = false;

export function lockBodyScroll() {
  scrollPosition = window.scrollY;
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollPosition}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
}

export function unlockBodyScroll() {
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";
  window.scrollTo(0, scrollPosition);
}

function isGuest() {
  return !document.documentElement.classList.contains('auth-verified');
}

export function initNavbar() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");
  if (!menuToggle || !navLinks || navbarInitialized) return;
  navbarInitialized = true;

  // Restore last-used visualizer filter in navbar link
  const vizLink = navLinks.querySelector('a[href="/pages/visualizers/visualizers.html"]');
  if (vizLink) {
    const savedFilter = localStorage.getItem('vizFilterCategory');
    if (savedFilter && savedFilter !== 'all') {
      vizLink.href = '/pages/visualizers/visualizers.html?category=' + encodeURIComponent(savedFilter);
    }
  }

  let overlay = document.querySelector(".nav-overlay");
  if (!overlay) { overlay = document.createElement("div"); overlay.className = "nav-overlay"; document.body.appendChild(overlay); }
  const toggleMenu = (open) => {
    const isOpen = open !== undefined ? open : !navLinks.classList.contains("active");
    navLinks.classList.toggle("active", isOpen);
    menuToggle.setAttribute("aria-expanded", isOpen);
    if (overlay) overlay.classList.toggle("active", isOpen);
    if (isOpen) {
      lockBodyScroll();
    } else {
      unlockBodyScroll();
    }
    const icon = menuToggle.querySelector("i");
    if (icon) { icon.classList.toggle("fa-bars", !isOpen); icon.classList.toggle("fa-times", isOpen); }
  };
  const closeMenu = () => { if (navLinks.classList.contains("active")) toggleMenu(false); };
  menuToggle.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(); });
  overlay.addEventListener("click", closeMenu);
  navLinks.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));



  const dropdownToggles = document.querySelectorAll(".dropdown-toggle");
  const isMobile = () => window.matchMedia("(max-width: 1024px)").matches;
  dropdownToggles.forEach(toggle => {
    const parent = toggle.closest(".has-dropdown");
    const menu = parent?.querySelector(".dropdown-menu");
    if (!parent || !menu) return;
    const isSettingsToggle = toggle.classList.contains("settings-toggle");
    let hoverTimeout;
    const showMenu = () => { clearTimeout(hoverTimeout); parent.classList.add("open"); toggle.setAttribute("aria-expanded", "true"); };
    const hideMenu = () => { hoverTimeout = setTimeout(() => { parent.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }, 250); };
    // Hover behavior: only for non-settings dropdowns on desktop
    if (!isSettingsToggle) {
      parent.addEventListener("mouseenter", () => { if (!isMobile()) showMenu(); });
      parent.addEventListener("mouseleave", () => { if (!isMobile()) hideMenu(); });
      toggle.addEventListener("focus", () => { if (!isMobile()) showMenu(); });
      parent.addEventListener("focusout", (event) => {
        if (!isMobile() && !parent.contains(event.relatedTarget)) hideMenu();
      });
    }
    // Click behavior: always for settings, mobile-only for others
    toggle.addEventListener("click", (e) => {
      if (isSettingsToggle || isMobile()) {
        e.preventDefault();
        e.stopPropagation();
        // Close other open dropdowns first
        document.querySelectorAll(".has-dropdown.open").forEach(el => {
          if (el !== parent) { el.classList.remove("open"); el.querySelector(".dropdown-toggle")?.setAttribute("aria-expanded", "false"); }
        });
        const isOpen = parent.classList.toggle("open");
        toggle.setAttribute("aria-expanded", isOpen);
      }
    });
    menu.querySelectorAll(".dropdown-item").forEach(item => { item.addEventListener("click", () => { if (isSettingsToggle || isMobile()) { parent.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); } }); });
  });
  // Close settings dropdown when clicking outside
  document.addEventListener("click", (e) => {
    document.querySelectorAll(".nav-settings-dropdown.open").forEach(el => {
      if (!el.contains(e.target)) { el.classList.remove("open"); el.querySelector(".dropdown-toggle")?.setAttribute("aria-expanded", "false"); }
    });
  });

  // Expandable circular search bar
  const navSearch = document.getElementById("navSearchDesktop");
  const searchInput = navSearch?.querySelector(".nav-search-input");
  if (navSearch && searchInput) {
    // Click on collapsed circle expands it
    navSearch.addEventListener("click", function(e) {
      if (!navSearch.classList.contains("expanded")) {
        e.stopPropagation();
        navSearch.classList.add("expanded");
        setTimeout(() => searchInput.focus(), 250);
      }
    });
    // Blur collapses back to circle (with delay for dropdown/clear clicks)
    searchInput.addEventListener("blur", () => {
      setTimeout(() => {
        if (!navSearch.contains(document.activeElement)) {
          navSearch.classList.remove("expanded");
          // Hide search dropdown when collapsing
          const dd = navSearch.querySelector(".search-dropdown");
          if (dd) dd.style.display = "none";
        }
      }, 200);
    });
    // Escape key collapses
    searchInput.addEventListener("keydown", function(e) {
      if (e.key === "Escape") {
        searchInput.blur();
        navSearch.classList.remove("expanded");
      }
    });
    // Prevent mousedown on clear button from triggering blur collapse
    const clearBtn = navSearch.querySelector(".clear-search-btn");
    if (clearBtn) {
      clearBtn.addEventListener("mousedown", (e) => e.stopPropagation());
    }
    // Prevent mousedown on search dropdown from triggering blur collapse
    const searchDropdown = navSearch.querySelector(".search-dropdown");
    if (searchDropdown) {
      searchDropdown.addEventListener("mousedown", (e) => e.stopPropagation());
    }
  }
  window.addEventListener("resize", () => {
    if (!isMobile()) {
      if (navLinks.classList.contains("active")) toggleMenu(false);
      document.querySelectorAll(".has-dropdown.open").forEach(el => el.classList.remove("open"));
      dropdownToggles.forEach(toggle => toggle.setAttribute("aria-expanded", "false"));
    }
  });
}
// Legacy global exports
window.lockBodyScroll = lockBodyScroll;
window.unlockBodyScroll = unlockBodyScroll;
window.initNavbar = initNavbar;
