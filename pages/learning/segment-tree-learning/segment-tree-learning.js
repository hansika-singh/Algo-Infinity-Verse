/**
 * segment-tree-learning.js
 * Interactivity for the Segment Tree Algorithms page
 */
document.addEventListener("DOMContentLoaded", () => {
    initHeroTyping();
    initStatsAnimation();
    initExerciseToggles();
    initSidebarSpy();
    initProgressTracker();
    initLangSwitching();
});

/* Hero Typing Animation */
function initHeroTyping() {
    const el = document.getElementById("typingTextSeg");
    if (!el) return;

    const words = [
        "Range Sum Queries",
        "Range Minimum Queries",
        "Lazy Propagation",
        "O(log N) Updates",
        "Divide and Conquer"
    ];

    let wordIdx = 0;
    let charIdx = 0;
    let isDeleting = false;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
        el.textContent = words[0];
        return;
    }

    function tick() {
        const current = words[wordIdx];

        if (isDeleting) {
            el.textContent = current.substring(0, charIdx - 1);
            charIdx--;
        } else {
            el.textContent = current.substring(0, charIdx + 1);
            charIdx++;
        }

        let speed = isDeleting ? 50 : 100;

        if (!isDeleting && charIdx === current.length) {
            speed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIdx === 0) {
            isDeleting = false;
            wordIdx = (wordIdx + 1) % words.length;
            speed = 500;
        }

        setTimeout(() => requestAnimationFrame(tick), speed);
    }

    tick();
}

/* Stats Counter Animation */
function initStatsAnimation() {
    const statNumbers = document.querySelectorAll(".stat-number[data-target]");
    if (!statNumbers.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const target = parseInt(entry.target.getAttribute("data-target"), 10);
                    let current = 0;
                    const step = Math.ceil(target / 30) || 1;
                    const timer = setInterval(() => {
                        current += step;
                        if (current >= target) {
                            current = target;
                            clearInterval(timer);
                        }
                        entry.target.textContent = current;
                    }, 40);
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.5, rootMargin: "0px 0px -50px 0px" }
    );

    statNumbers.forEach((s) => observer.observe(s));
}

/* Exercise Show / Hide Toggle */
function initExerciseToggles() {
    document.querySelectorAll(".seg-exercise-toggle").forEach((btn) => {
        btn.addEventListener("click", () => {
            const targetId = btn.getAttribute("aria-controls");
            const solution = document.getElementById(targetId);
            if (!solution) return;

            const isVisible = solution.classList.toggle("visible");
            btn.setAttribute("aria-expanded", String(isVisible));
            btn.textContent = isVisible ? "Hide Solution" : "Show Hint";
        });
    });
}

/* Sidebar Scroll-Spy */
function initSidebarSpy() {
    const links = document.querySelectorAll(".seg-sidebar-nav a");
    const lessons = document.querySelectorAll(".seg-lesson");
    if (!links.length || !lessons.length) return;

    const NAV_HEIGHT = 110;

    function getActiveId() {
        let bestId = null;
        let bestDist = Infinity;

        lessons.forEach((lesson) => {
            const rect = lesson.getBoundingClientRect();
            const dist = Math.abs(rect.top - NAV_HEIGHT);
            if (dist < bestDist) {
                bestDist = dist;
                bestId = lesson.getAttribute("id");
            }
        });

        return bestId;
    }

    let ticking = false;

    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const id = getActiveId();
            if (id) {
                links.forEach((l) => l.classList.remove("active"));
                const active = document.querySelector(`.seg-sidebar-nav a[href="#${id}"]`);
                if (active) active.classList.add("active");
            }
            ticking = false;
        });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
}

/* Progress Tracker */
function initProgressTracker() {
    const STORAGE_KEY = "seg-learning-progress";
    const TOTAL_TOPICS = 5;
    const fill = document.getElementById("segProgressFill");
    const count = document.getElementById("segProgressCount");
    const percent = document.getElementById("segProgressPercent");
    const bar = document.querySelector(".seg-progress-bar");

    if (!fill || !count) return;

    let completed = new Set();
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (Array.isArray(saved)) completed = new Set(saved);
    } catch {
        /* ignore parse errors */
    }

    function updateUI() {
        const pct = Math.min(100, Math.round((completed.size / TOTAL_TOPICS) * 100));
        fill.style.width = pct + "%";
        count.textContent = Math.min(TOTAL_TOPICS, completed.size);
        if (percent) percent.textContent = pct + "%";
        if (bar) bar.setAttribute("aria-valuenow", pct);
    }

    updateUI();

    const lessons = document.querySelectorAll(".seg-lesson");
    const observer = new IntersectionObserver(
        (entries) => {
            let changed = false;
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const topic = entry.target.getAttribute("data-topic");
                    if (topic && topic !== "0" && !completed.has(topic)) {
                        completed.add(topic);
                        changed = true;
                    }
                }
            });
            if (changed) {
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
                } catch {
                    /* ignore storage quota errors */
                }
                updateUI();
            }
        },
        { threshold: 0.15, rootMargin: "0px 0px -20% 0px" }
    );

    lessons.forEach((l) => observer.observe(l));
}

/* Language Tab Switching */
function initLangSwitching() {
    window.switchSegLang = function (button, lang) {
        const container = button.closest(".seg-lang-container");
        if (!container) return;

        container.querySelectorAll(".seg-lang-tab-btn").forEach((btn) => btn.classList.remove("active"));
        container.querySelectorAll(".seg-lang-pane").forEach((pane) => pane.classList.remove("active"));

        button.classList.add("active");
        const pane = container.querySelector(`.seg-lang-pane[data-lang="${lang}"]`);
        if (pane) pane.classList.add("active");
    };
}
