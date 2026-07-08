document.addEventListener("DOMContentLoaded", () => {
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

  // Dark mode
  const darkModeToggle = document.getElementById("darkModeToggle");
  if (darkModeToggle) {
    const savedMode = localStorage.getItem("theme");
    const isLightMode = savedMode === "light";
    if (isLightMode) {
      document.documentElement.classList.add("light-mode");
      darkModeToggle.querySelector("i").classList.replace("fa-moon", "fa-sun");
    }

    darkModeToggle.addEventListener("click", () => {
      document.documentElement.classList.toggle("light-mode");
      const icon = darkModeToggle.querySelector("i");
      if (document.documentElement.classList.contains("light-mode")) {
        icon.classList.replace("fa-moon", "fa-sun");
        localStorage.setItem("theme", "light");
      } else {
        icon.classList.replace("fa-sun", "fa-moon");
        localStorage.setItem("theme", "dark");
      }
    });
  }
});

const supportForm = document.getElementById("supportForm");
const bugForm = document.getElementById("bugForm");
supportForm.addEventListener("submit", function (e) {
    e.preventDefault();
    showMessage("Support request submitted!");
    supportForm.reset();
});
bugForm.addEventListener("submit", function (e) {
    e.preventDefault();
    showMessage("Bug report submitted!");
    bugForm.reset();
});
function showMessage(text) {
    const message = document.createElement("div");
    message.innerText = text;
    message.className = "message-box";
    document.body.appendChild(message);
    setTimeout(() => {
        message.remove();
    }, 2000);
}