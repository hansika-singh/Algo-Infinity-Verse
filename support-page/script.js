document.addEventListener("DOMContentLoaded", function() {
    let menuToggle = document.getElementById("menuToggle");
    let navLinks = document.getElementById("navLinks");

    let overlay = document.querySelector(".nav-overlay");
    if (!overlay && menuToggle && navLinks) {
        overlay = document.createElement("div");
        overlay.className = "nav-overlay";
        document.body.appendChild(overlay);
    }

    let toggleMenu = function(open) {
        let isOpen = open !== undefined ? open : !navLinks.classList.contains("active");
        navLinks.classList.toggle("active", isOpen);
        menuToggle.setAttribute("aria-expanded", isOpen);
        if (overlay) overlay.classList.toggle("active", isOpen);
        document.body.style.overflow = isOpen ? "hidden" : "";
        let icon = menuToggle.querySelector("i");
        if (icon) {
            icon.classList.toggle("fa-bars", !isOpen);
            icon.classList.toggle("fa-times", isOpen);
        }
    };

    let closeMenu = function() {
        if (!navLinks.classList.contains("active")) return;
        toggleMenu(false);
    };

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", function(e) {
            e.stopPropagation();
            toggleMenu();
        });

        if (overlay) overlay.addEventListener("click", closeMenu);

        navLinks.querySelectorAll("a").forEach(function(link) {
            link.addEventListener("click", closeMenu);
        });
    }

    let darkModeToggle = document.getElementById("darkModeToggle");
    if (darkModeToggle) {
        let savedMode = localStorage.getItem("theme");
        let isLightMode = savedMode === "light";
        if (isLightMode) {
            document.documentElement.classList.add("light-mode");
            darkModeToggle.querySelector("i").classList.replace("fa-moon", "fa-sun");
        }

        darkModeToggle.addEventListener("click", function() {
            document.documentElement.classList.toggle("light-mode");
            let icon = darkModeToggle.querySelector("i");
            if (document.documentElement.classList.contains("light-mode")) {
                icon.classList.replace("fa-moon", "fa-sun");
                localStorage.setItem("theme", "light");
            } else {
                icon.classList.replace("fa-sun", "fa-moon");
                localStorage.setItem("theme", "dark");
            }
        });
    }

    let supportForm = document.getElementById("supportForm");
    let bugForm = document.getElementById("bugForm");

    if (supportForm) {
        supportForm.addEventListener("submit", function(e) {
            e.preventDefault();
            showToast("Support request submitted!");
            supportForm.reset();
        });
    }

    if (bugForm) {
        bugForm.addEventListener("submit", function(e) {
            e.preventDefault();
            showToast("Bug report submitted!");
            bugForm.reset();
        });
    }

    function showToast(text) {
        let message = document.createElement("div");
        message.innerText = text;
        message.className = "message-box";
        document.body.appendChild(message);
        setTimeout(function() {
            message.remove();
        }, 2000);
    }

    window.showToast = showToast;
});