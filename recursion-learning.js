/**
 * recursion-learning.js
 * Interactivity for the Recursion Learning page:
 *  - Hero typing animation (recursion-themed words)
 *  - Stats counter animation (uses global animateValue from script.js)
 *  - Sidebar scroll-spy (active link tracking)
 *  - Progress bar (tracks completed topics via localStorage)
 *  - Exercise toggle (show/hide solutions)
 *  - Copy code button
 */

document.addEventListener("DOMContentLoaded", () => {
    initHeroTyping();
    initStatsAnimation();
    initExerciseToggles();
    initCopyButtons();
    initSidebarSpy();
    initProgressTracker();
});

/*  Hero Typing Animation */
function initHeroTyping() {
    const el = document.getElementById("typingTextRecursion");
    if (!el) return;

    const words = [
        "Base Case",
        "Recursive Case",
        "Call Stack",
        "Recursion Trees",
        "Divide & Conquer",
        "Problem Decomposition",
        "Backtracking",
        "Recursive Thinking",
    ];

    let wordIdx = 0;
    let charIdx = 0;
    let isDeleting = false;

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

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

/* Stats Counter Animation*/
function initStatsAnimation() {
    const statNumbers = document.querySelectorAll(".stat-number[data-target]");
    if (!statNumbers.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    if (typeof animateValue === "function") {
                        animateValue(entry.target);
                    } else {
                        // Fallback if global animateValue is unavailable
                        const target = parseInt(entry.target.getAttribute("data-target"), 10);
                        let current = 0;
                        const step = Math.ceil(target / 30);
                        const timer = setInterval(() => {
                            current += step;
                            if (current >= target) {
                                current = target;
                                clearInterval(timer);
                            }
                            entry.target.textContent = current;
                        }, 40);
                    }
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.5, rootMargin: "0px 0px -50px 0px" }
    );

    statNumbers.forEach((s) => observer.observe(s));
}

/* Exercise Show / Hide Toggle*/
function initExerciseToggles() {
    document
        .querySelectorAll(".recursion-exercise-toggle")
        .forEach((btn) => {
            btn.addEventListener("click", () => {
                const targetId = btn.getAttribute("aria-controls");
                const solution = document.getElementById(targetId);
                if (!solution) return;

                const isVisible = solution.classList.toggle("visible");
                btn.setAttribute("aria-expanded", String(isVisible));
                btn.textContent = isVisible ? "Hide Solution" : "Show Solution";
            });
        });
}

/* Copy Code Button*/
function initCopyButtons() {
    document.querySelectorAll(".recursion-code-copy").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const code = btn.getAttribute("data-code");
            if (!code) return;

            const markCopied = () => {
                btn.textContent = "Copied!";
                btn.classList.add("copied");
                setTimeout(() => {
                    btn.textContent = "Copy";
                    btn.classList.remove("copied");
                }, 2000);
            };

            try {
                await navigator.clipboard.writeText(code);
                markCopied();
            } catch {
                // Fallback for older browsers / non-secure contexts
                const textarea = document.createElement("textarea");
                textarea.value = code;
                textarea.style.cssText = "position:fixed;opacity:0;pointer-events:none";
                document.body.appendChild(textarea);
                textarea.select();
             try {
                const copied = document.execCommand("copy");
                if (copied) {
                    markCopied();
                } else {
                    console.warn("Copy failed");
                }
             } catch (e) {
                 console.warn("Copy failed", e);
             }
             document.body.removeChild(textarea);
            }
        });
    });
}

/* Sidebar Scroll-Spy*/
function initSidebarSpy() {
    const links = document.querySelectorAll(".recursion-sidebar-nav a");
    const lessons = document.querySelectorAll(".recursion-lesson");
    if (!links.length || !lessons.length) return;

    const NAV_HEIGHT = 110; // offset for fixed navbar

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
                const active = document.querySelector(
                    `.recursion-sidebar-nav a[href="#${id}"]`
                );
                if (active) active.classList.add("active");
            }
            ticking = false;
        });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // run once on load
}

/* Progress Tracker*/
function initProgressTracker() {
    const STORAGE_KEY = "recursion-learning-progress";
    const TOTAL_TOPICS = 7; // matches data-topic values 1–7
    const fill = document.getElementById("progressFill");
    const count = document.getElementById("progressCount");
    const bar = document.querySelector(".recursion-progress-bar");

    if (!fill || !count) return;

    let completed = new Set();
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (Array.isArray(saved)) completed = new Set(saved);
    } catch {
        /* ignore parse errors */
    }

    function updateUI() {
        const pct = Math.round((completed.size / TOTAL_TOPICS) * 100);
        fill.style.width = pct + "%";
        count.textContent = completed.size;
        if (bar) bar.setAttribute("aria-valuenow", pct);
    }

    updateUI();

    const lessons = document.querySelectorAll(".recursion-lesson");
    count.textContent = completed.size;
    const observer = new IntersectionObserver(
        (entries) => {
            let changed = false;
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const topic = entry.target.getAttribute("data-topic");
                    if (topic && !completed.has(topic)) {
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