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

export function initNavbar() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");
  if (!menuToggle || !navLinks || navbarInitialized) return;
  navbarInitialized = true;

  const homeLink = document.querySelector('.nav-link[href="/index.html#home"]');
  if (homeLink) {
    const isHomePage = document.body.getAttribute('data-page') === 'index';
    homeLink.closest('.nav-item').style.display = isHomePage ? 'none' : '';
  }

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
    let hoverTimeout;
    const showMenu = () => { clearTimeout(hoverTimeout); parent.classList.add("open"); toggle.setAttribute("aria-expanded", "true"); };
    const hideMenu = () => { hoverTimeout = setTimeout(() => { parent.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }, 250); };
    parent.addEventListener("mouseenter", () => { if (!isMobile()) showMenu(); });
    parent.addEventListener("mouseleave", () => { if (!isMobile()) hideMenu(); });
    toggle.addEventListener("focus", () => { if (!isMobile()) showMenu(); });
    parent.addEventListener("focusout", () => { if (!isMobile()) hideMenu(); });
    toggle.addEventListener("click", (e) => { if (isMobile()) { e.preventDefault(); e.stopPropagation(); const isOpen = parent.classList.toggle("open"); toggle.setAttribute("aria-expanded", isOpen); } });
    menu.querySelectorAll(".dropdown-item").forEach(item => { item.addEventListener("click", () => { if (isMobile()) { parent.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); } }); });
  });
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
