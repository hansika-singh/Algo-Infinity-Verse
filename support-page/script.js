document.addEventListener("DOMContentLoaded", function() {
    var menuToggle = document.getElementById("menuToggle");
    var navLinks = document.getElementById("navLinks");

    var overlay = document.querySelector(".nav-overlay");
    if (!overlay && menuToggle && navLinks) {
        overlay = document.createElement("div");
        overlay.className = "nav-overlay";
        document.body.appendChild(overlay);
    }

    var toggleMenu = function(open) {
        var isOpen = open !== undefined ? open : !navLinks.classList.contains("active");
        navLinks.classList.toggle("active", isOpen);
        menuToggle.setAttribute("aria-expanded", isOpen);
        if (overlay) overlay.classList.toggle("active", isOpen);
        document.body.style.overflow = isOpen ? "hidden" : "";
        var icon = menuToggle.querySelector("i");
        if (icon) {
            icon.classList.toggle("fa-bars", !isOpen);
            icon.classList.toggle("fa-times", isOpen);
        }
    };

    var closeMenu = function() {
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

    var darkModeToggle = document.getElementById("darkModeToggle");
    if (darkModeToggle) {
        var savedMode = localStorage.getItem("theme");
        var isLightMode = savedMode === "light";
        if (isLightMode) {
            document.documentElement.classList.add("light-mode");
            darkModeToggle.querySelector("i").classList.replace("fa-moon", "fa-sun");
        }

        darkModeToggle.addEventListener("click", function() {
            document.documentElement.classList.toggle("light-mode");
            var icon = darkModeToggle.querySelector("i");
            if (document.documentElement.classList.contains("light-mode")) {
                icon.classList.replace("fa-moon", "fa-sun");
                localStorage.setItem("theme", "light");
            } else {
                icon.classList.replace("fa-sun", "fa-moon");
                localStorage.setItem("theme", "dark");
            }
        });
    }

    var supportForm = document.getElementById("supportForm");
    var bugForm = document.getElementById("bugForm");

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
        var message = document.createElement("div");
        message.innerText = text;
        message.className = "message-box";
        document.body.appendChild(message);
        setTimeout(function() {
            message.remove();
        }, 2000);
    }

    window.showToast = showToast;
});