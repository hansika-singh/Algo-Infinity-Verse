// ===== INITIALIZATION & STATE MANAGEMENT =====
document.addEventListener("DOMContentLoaded", () => {
  
  // Hide loading screen
  setTimeout(() => {
    const loader = document.getElementById("loading-screen");
    if (loader) {
      loader.classList.add("hidden");
    }
  }, 1000);

  // Initialize Dark/Light Mode Sync
  syncTheme();

  // Initialize Navbar toggle
  initNavbar();

  // Initialize Print Flow
  initPrint();

  // Scroll to Top logic
  initScrollTop();
});

// ===== DARK/LIGHT THEME SYNCHRONIZATION =====
function syncTheme() {
  const toggle = document.getElementById("darkModeToggle");
  if (!toggle) return;
  const icon = toggle.querySelector("i");

  // Check saved preference
  const savedMode = localStorage.getItem("theme");
  if (savedMode === "light") {
    document.documentElement.classList.add("light-mode");
    if (icon) {
      icon.classList.remove("fa-moon");
      icon.classList.add("fa-sun");
    }
  }

  toggle.addEventListener("click", () => {
    document.documentElement.classList.toggle("light-mode");
    const isLight = document.documentElement.classList.contains("light-mode");
    if (icon) {
      icon.classList.toggle("fa-moon");
      icon.classList.toggle("fa-sun");
    }
    localStorage.setItem("theme", isLight ? "light" : "dark");
  });
}

// ===== MOBILE NAVBAR DRIVER =====
function initNavbar() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  let overlay = document.querySelector(".nav-overlay");
  if (!overlay && menuToggle && navLinks) {
    overlay = document.createElement("div");
    overlay.className = "nav-overlay";
    document.body.appendChild(overlay);
  }

  const toggleMenu = (open) => {
    const isOpen = open !== undefined ? open : !navLinks.classList.contains("active");
    navLinks.classList.toggle("active", isOpen);
    menuToggle.setAttribute("aria-expanded", isOpen);
    if (overlay) overlay.classList.toggle("active", isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
    const icon = menuToggle.querySelector("i");
    if (icon) {
      icon.classList.toggle("fa-bars", !isOpen);
      icon.classList.toggle("fa-times", isOpen);
    }
  };

  const closeMenu = () => {
    if (!navLinks.classList.contains("active")) return;
    toggleMenu(false);
  };

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    if (overlay) overlay.addEventListener("click", closeMenu);

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });
  }

  // Dropdown functionality
  const dropdownToggles = document.querySelectorAll(".dropdown-toggle");
  const isMobile = () => window.matchMedia("(max-width: 1024px)").matches;

  dropdownToggles.forEach((toggle) => {
    const parent = toggle.closest(".has-dropdown");
    const menu = parent?.querySelector(".dropdown-menu");
    if (!parent || !menu) return;

    let hoverTimeout;

    const showMenu = () => { clearTimeout(hoverTimeout); parent.classList.add("open"); toggle.setAttribute("aria-expanded", "true"); };
    const hideMenu = () => { hoverTimeout = setTimeout(() => { parent.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }, 250); };

    parent.addEventListener("mouseenter", () => { if (!isMobile()) showMenu(); });
    parent.addEventListener("mouseleave", () => { if (!isMobile()) hideMenu(); });
    toggle.addEventListener("focus", () => { if (!isMobile()) showMenu(); });
    menu.addEventListener("focusin", () => { if (!isMobile()) showMenu(); });
    parent.addEventListener("focusout", () => { if (!isMobile()) hideMenu(); });

    toggle.addEventListener("click", (e) => {
      if (isMobile()) { e.preventDefault(); e.stopPropagation(); const isOpen = parent.classList.toggle("open"); toggle.setAttribute("aria-expanded", isOpen); }
    });

    menu.querySelectorAll(".dropdown-item").forEach((item) => {
      item.addEventListener("click", () => {
        if (isMobile()) { parent.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
      });
    });
  });

  window.addEventListener("resize", () => {
    if (!isMobile()) {
      document.querySelectorAll(".has-dropdown.open").forEach((el) => el.classList.remove("open"));
      dropdownToggles.forEach((toggle) => toggle.setAttribute("aria-expanded", "false"));
    }
  });
}

// ===== PDF EXPORT DRIVER =====
function initPrint() {
  const exportBtn = document.getElementById("exportPdfBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      window.print();
    });
  }
}

// ===== SCROLL TO TOP DRIVER =====
function initScrollTop() {
  const scrollTopBtn = document.getElementById("scrollTopBtn");
  if (!scrollTopBtn) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 400) {
      scrollTopBtn.classList.add("visible");
    } else {
      scrollTopBtn.classList.remove("visible");
    }
  });

  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

document.addEventListener("DOMContentLoaded", () => {

  // Resume checklist persistence
  const checkboxes = document.querySelectorAll(
    ".resume-checklist input[type='checkbox']"
  );

  checkboxes.forEach((checkbox, index) => {
    const saved = localStorage.getItem(`resume-check-${index}`);

    if (saved === "true") {
      checkbox.checked = true;
    }

    checkbox.addEventListener("change", () => {
      localStorage.setItem(
        `resume-check-${index}`,
        checkbox.checked
      );
    });
  });

  // Download toast
  const templateButtons =
    document.querySelectorAll(".template-download");

  templateButtons.forEach(button => {
    button.addEventListener("click", () => {
      showToast("Template download started 🚀");
    });
  });

});

function showToast(message) {

  const toast = document.createElement("div");
  toast.className = "resume-toast";
  toast.textContent = message;

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");

    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2500);
}

