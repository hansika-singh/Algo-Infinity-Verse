/**
 * binary-search-learning.js
 * Comprehensive logic for the Binary Search Learning page.
 */

document.addEventListener("DOMContentLoaded", () => {
    initHeroTyping();
    initVisualizer();
    initExerciseToggles();
    initCopyButtons();
    initSidebarSpy();
    initProgressTracker();
});

/* ─────────────────────────────────────────────
   1. Hero Typing Animation
   ───────────────────────────────────────────── */
function initHeroTyping() {
    const el = document.getElementById("typingTextBinarySearch");
    if (!el) return;

    const words = ["Divide & Conquer", "Logarithmic Time", "O(log n) Search", "Sorted Arrays Only"];
    let wordIdx = 0, charIdx = 0, isDeleting = false;

    function tick() {
        const current = words[wordIdx];
        el.textContent = isDeleting 
            ? current.substring(0, charIdx - 1) 
            : current.substring(0, charIdx + 1);
        
        charIdx = isDeleting ? charIdx - 1 : charIdx + 1;
        let speed = isDeleting ? 50 : 100;

        if (!isDeleting && charIdx === current.length) {
            speed = 2000; isDeleting = true;
        } else if (isDeleting && charIdx === 0) {
            isDeleting = false; wordIdx = (wordIdx + 1) % words.length; speed = 500;
        }
        setTimeout(tick, speed);
    }
    tick();
}

/* ─────────────────────────────────────────────
   2. Interactive Visualizer Engine (Updated for 88)
   ───────────────────────────────────────────── */
function initVisualizer() {
    const arr = [2, 7, 13, 21, 37, 45, 59, 72, 88, 91];
    const target = 88; // Target updated to force multiple steps
    let low = 0, high = arr.length - 1, mid = -1;
    const container = document.getElementById("array-container");
    const statusText = document.getElementById("status-text");

    function renderArray() {
        container.innerHTML = '';
        arr.forEach((val, idx) => {
            const el = document.createElement("div");
            el.className = "array-element";
            if (idx === mid) el.classList.add("active");
            if (val === target && mid !== -1 && arr[mid] === target) el.classList.add("found");
            if (idx < low || idx > high) el.classList.add("discarded");
            el.textContent = val;
            container.appendChild(el);
        });
        document.getElementById("low-val").textContent = low;
        document.getElementById("high-val").textContent = high;
        document.getElementById("mid-val").textContent = mid === -1 ? "-" : mid;
    }

    document.getElementById("step-btn").addEventListener("click", () => {
        if (low > high) {
            statusText.textContent = "Search complete: Target not found!";
            return;
        }
        mid = Math.floor((low + high) / 2);
        
        if (arr[mid] === target) {
            statusText.textContent = `Success! Found ${target} at index ${mid}.`;
        } else if (arr[mid] < target) {
            statusText.textContent = `${arr[mid]} < ${target}. Discarding left half.`;
            low = mid + 1;
        } else {
            statusText.textContent = `${arr[mid]} > ${target}. Discarding right half.`;
            high = mid - 1;
        }
        renderArray();
    });

    document.getElementById("reset-btn").addEventListener("click", () => {
        low = 0; high = arr.length - 1; mid = -1;
        statusText.textContent = "Awaiting execution...";
        renderArray();
    });

    renderArray();
}

/* ─────────────────────────────────────────────
   3. Utilities (Toggles, Copy, Scroll-Spy, Progress)
   ───────────────────────────────────────────── */
function initExerciseToggles() {
    document.querySelectorAll(".binary-search-exercise-toggle").forEach(btn => {
        btn.addEventListener("click", () => {
            const solution = document.getElementById(btn.getAttribute("aria-controls"));
            const isVisible = solution.classList.toggle("visible");
            btn.setAttribute("aria-expanded", isVisible);
            btn.textContent = isVisible ? "Hide Solution" : "Show Solution";
        });
    });
}

function initCopyButtons() {
    document.querySelectorAll(".binary-search-code-copy").forEach(btn => {
        btn.addEventListener("click", async () => {
            await navigator.clipboard.writeText(btn.getAttribute("data-code"));
            btn.textContent = "Copied!"; btn.classList.add("copied");
            setTimeout(() => { btn.textContent = "Copy"; btn.classList.remove("copied"); }, 2000);
        });
    });
}

function initSidebarSpy() {
    const links = document.querySelectorAll(".binary-search-sidebar-nav a");
    const lessons = document.querySelectorAll(".binary-search-lesson");
    window.addEventListener("scroll", () => {
        let current = "";
        lessons.forEach(l => {
            if (pageYOffset >= l.offsetTop - 150) current = l.getAttribute("id");
        });
        links.forEach(l => {
            l.classList.remove("active");
            if (l.getAttribute("href") === `#${current}`) l.classList.add("active");
        });
    });
}

function initProgressTracker() {
    const STORAGE_KEY = "binary-search-progress";
    const TOTAL = 5;
    const fill = document.getElementById("progressFill");
    const count = document.getElementById("progressCount");
    let completed = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                completed.add(e.target.getAttribute("data-topic"));
                const pct = Math.round((completed.size / TOTAL) * 100);
                fill.style.width = pct + "%";
                count.textContent = completed.size;
                localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
            }
        });
    }, { threshold: 0.6 });

    document.querySelectorAll(".binary-search-lesson").forEach(l => observer.observe(l));
}

/* ─────────────────────────────────────────────
   Stats Counter Animation Helper
   ───────────────────────────────────────────── */
function animateValue(obj) {
    const target = parseInt(obj.getAttribute("data-target"));
    const duration = 1500; // 1.5 seconds
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        obj.textContent = Math.floor(progress * target);
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// Ensure this runs when the hero section becomes visible
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            document.querySelectorAll('.stat-number').forEach(animateValue);
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const heroSection = document.querySelector('.hero');
if (heroSection) observer.observe(heroSection);