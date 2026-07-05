/**
 * backtracking-learning.js
 * Interactivity for the Backtracking Learning page:
 *  - Hero typing animation
 *  - Stats counter animation
 *  - Sidebar scroll-spy
 *  - Interactive Progression System
 *  - Code Language Switcher
 *  - Copy code button
 */

document.addEventListener("DOMContentLoaded", () => {
    initHeroTyping();
    initStatsAnimation();
    initCopyButtons();
    initSidebarSpy();
    initInteractiveProgression();
});

/*  Hero Typing Animation */
function initHeroTyping() {
    const el = document.getElementById("typingTextBacktracking");
    if (!el) return;

    const words = [
        "State Space Search",
        "Subset Generation",
        "Permutations",
        "N-Queens Solver",
        "Sudoku Solving",
        "Pruning Paths",
        "Constraint Checking",
        "Avoiding Redundancy",
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
                    if (typeof window.animateValue === "function") {
                        window.animateValue(entry.target);
                    } else {
                        // Fallback
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

/* Copy Code Button*/
function initCopyButtons() {
    document.querySelectorAll(".backtracking-code-copy").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const container = btn.closest('.lang-pane');
            if(!container) return;
            const codeBlock = container.querySelector('code');
            if(!codeBlock) return;
            const code = codeBlock.innerText;

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
    const links = document.querySelectorAll(".backtracking-sidebar-nav a");
    const lessons = document.querySelectorAll(".backtracking-lesson");
    if (!links.length || !lessons.length) return;

    const NAV_HEIGHT = 110; 

    function getActiveId() {
        let bestId = null;
        let bestDist = Infinity;

        lessons.forEach((lesson) => {
            if (lesson.classList.contains("locked-lesson")) return;
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
                    `.backtracking-sidebar-nav a[href="#${id}"]`
                );
                if (active) active.classList.add("active");
            }
            ticking = false;
        });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); 
}

/* Interactive Progression System */
function initInteractiveProgression() {
    const STORAGE_KEY = "backtracking-progress-v2";
    const TOTAL_TOPICS = 8; 
    const fill = document.getElementById("progressFill");
    const count = document.getElementById("progressCount");
    const bar = document.querySelector(".backtracking-progress-bar");
    const lessons = Array.from(document.querySelectorAll(".backtracking-lesson"));

    if (!fill || !count || lessons.length === 0) return;

    let completed = new Set();
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (Array.isArray(saved)) completed = new Set(saved);
    } catch {
        // ignore
    }

    function updateUI() {
        const pct = Math.round((completed.size / TOTAL_TOPICS) * 100);
        fill.style.width = pct + "%";
        count.textContent = completed.size;
        if (bar) bar.setAttribute("aria-valuenow", pct);
    }

    const quizzes = {
        "1": {
            question: "What is backtracking an optimized version of?",
            options: ["Breadth-First Search", "Brute-Force Search", "Dynamic Programming", "Greedy Algorithm"],
            answer: 1
        },
        "2": {
            question: "Which of the following describes a node where constraints are violated?",
            options: ["Valid Solution", "Partial Solution", "Root Node", "Dead End"],
            answer: 3
        },
        "3": {
            question: "What are the two choices for each element in subset generation?",
            options: ["Include or Exclude", "Sort or Reverse", "Add or Multiply", "Push or Pop"],
            answer: 0
        },
        "4": {
            question: "What technique avoids using the same element twice in permutations?",
            options: ["Sorting the array", "Using a 'used' array or boolean flags", "Binary Search", "Two Pointers"],
            answer: 1
        },
        "5": {
            question: "Which constraint pruning is essential for N-Queens?",
            options: ["Row, Column, and Diagonals", "Only Rows", "Only Columns", "Adjacent cells"],
            answer: 0
        },
        "6": {
            question: "How many validation rules exist for placing a digit in Sudoku?",
            options: ["1 (Grid)", "2 (Row, Column)", "3 (Row, Column, 3x3 Subgrid)", "4 (Row, Column, Diagonal, Subgrid)"],
            answer: 2
        },
        "7": {
            question: "What does forward checking involve?",
            options: ["Checking all previous choices", "Predicting if future choices are valid based on current state", "Running a separate BFS", "Caching previous results"],
            answer: 1
        },
        "8": {
            question: "What is the typical time complexity of generating subsets?",
            options: ["O(N!)", "O(N^2)", "O(2^N)", "O(log N)"],
            answer: 2
        }
    };

    function renderLessonActions() {
        lessons.forEach((lesson, index) => {
            const topicId = lesson.getAttribute("data-topic");
            const isCompleted = completed.has(topicId);
            
            // Lesson is visible if it's the first lesson, OR if the PREVIOUS lesson is completed
            const prevTopicId = index > 0 ? lessons[index - 1].getAttribute("data-topic") : null;
            const isUnlocked = index === 0 || completed.has(prevTopicId);

            if (isUnlocked) {
                lesson.classList.remove("locked-lesson");
            } else {
                lesson.classList.add("locked-lesson");
            }

            // Clean up old actions and quizzes if any
            let actionContainer = lesson.querySelector(".lesson-actions");
            if (actionContainer) actionContainer.remove();
            let oldQuiz = lesson.querySelector(".quiz-container");
            if (oldQuiz) oldQuiz.remove();

            // Build new actions
            actionContainer = document.createElement("div");
            actionContainer.className = "lesson-actions";

            // If there's a previous lesson, we can always show "Previous" button
            if (index > 0) {
                const prevBtn = document.createElement("button");
                prevBtn.className = "btn btn-outline prev-lesson-btn";
                prevBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Previous';
                prevBtn.addEventListener("click", () => {
                    lessons[index - 1].scrollIntoView({ behavior: 'smooth' });
                });
                actionContainer.appendChild(prevBtn);
            }

            if (!isCompleted) {
                const completeBtn = document.createElement("button");
                completeBtn.className = "btn btn-primary mark-complete-btn";
                completeBtn.innerHTML = 'Complete & Continue <i class="fas fa-check"></i>';
                completeBtn.disabled = true; // Disabled until quiz is answered correctly

                const quizData = quizzes[topicId];
                if (quizData) {
                    const quizContainer = document.createElement("div");
                    quizContainer.className = "quiz-container";
                    
                    const qTitle = document.createElement("div");
                    qTitle.className = "quiz-question";
                    qTitle.textContent = "Quick Check: " + quizData.question;
                    quizContainer.appendChild(qTitle);

                    const optsContainer = document.createElement("div");
                    optsContainer.className = "quiz-options";

                    let answered = false;

                    quizData.options.forEach((optText, optIdx) => {
                        const optDiv = document.createElement("button");
                        optDiv.className = "quiz-option";
                        optDiv.textContent = optText;

                        optDiv.addEventListener("click", () => {
                            if (answered) return;
                            if (optIdx === quizData.answer) {
                                optDiv.classList.add("correct");
                                optDiv.innerHTML = `${optText} <i class="fas fa-check-circle" style="margin-left:auto"></i>`;
                                answered = true;
                                completeBtn.disabled = false;
                            } else {
                                optDiv.classList.remove("incorrect");
                                // Trigger reflow to restart animation
                                void optDiv.offsetWidth;
                                optDiv.classList.add("incorrect");
                            }
                        });

                        optsContainer.appendChild(optDiv);
                    });
                    
                    quizContainer.appendChild(optsContainer);
                    lesson.appendChild(quizContainer);
                }

                completeBtn.addEventListener("click", () => {
                    if (completeBtn.disabled) return;
                    completed.add(topicId);
                    try {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
                    } catch {}
                    updateUI();
                    renderLessonActions();

                    // Scroll to next lesson if it exists
                    if (index < lessons.length - 1) {
                        setTimeout(() => {
                            lessons[index + 1].scrollIntoView({ behavior: 'smooth' });
                        }, 100); 
                    }
                });
                actionContainer.appendChild(completeBtn);
            } else {
                // If completed, show "Next" button if there's a next lesson
                if (index < lessons.length - 1) {
                    const nextBtn = document.createElement("button");
                    nextBtn.className = "btn btn-outline next-lesson-btn";
                    if (index === 0) nextBtn.style.marginLeft = "auto";
                    nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
                    nextBtn.addEventListener("click", () => {
                        lessons[index + 1].scrollIntoView({ behavior: 'smooth' });
                    });
                    actionContainer.appendChild(nextBtn);
                }
            }

            lesson.appendChild(actionContainer);
        });
    }

    updateUI();
    renderLessonActions();
}

/* Language Switcher globally exposed */
window.switchLang = function(btn, lang) {
    const container = btn.closest('.font-lang-container');
    if (!container) return;
    
    // Update tabs
    const tabs = container.querySelectorAll('.lang-tab-btn');
    tabs.forEach(t => t.classList.remove('active'));
    btn.classList.add('active');

    // Update panes
    const panes = container.querySelectorAll('.lang-pane');
    panes.forEach(p => {
        if (p.getAttribute('data-lang') === lang) {
            p.classList.add('active');
        } else {
            p.classList.remove('active');
        }
    });
}
