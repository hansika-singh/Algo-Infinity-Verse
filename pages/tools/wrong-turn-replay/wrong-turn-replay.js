document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initScrollTop();
  initReplay();
});

function initScrollTop() {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;
  window.addEventListener("scroll", () => btn.classList.toggle("visible", window.scrollY > 400));
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function initNavbar() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks   = document.getElementById("navLinks");
  if (!menuToggle || !navLinks) return;
  let overlay = document.querySelector(".nav-overlay");
  if (!overlay) { overlay = document.createElement("div"); overlay.className = "nav-overlay"; document.body.appendChild(overlay); }
  const toggleMenu = (open) => {
    const isOpen = open !== undefined ? open : !navLinks.classList.contains("active");
    navLinks.classList.toggle("active", isOpen);
    menuToggle.setAttribute("aria-expanded", isOpen);
    overlay.classList.toggle("active", isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
    const icon = menuToggle.querySelector("i");
    if (icon) { icon.classList.toggle("fa-bars", !isOpen); icon.classList.toggle("fa-times", isOpen); }
  };
  menuToggle.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(); });
  overlay.addEventListener("click", () => toggleMenu(false));
  navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => toggleMenu(false)));
  const isMobile = () => window.matchMedia("(max-width: 1024px)").matches;
  document.querySelectorAll(".dropdown-toggle").forEach((toggle) => {
    const parent = toggle.closest(".has-dropdown");
    const menu   = parent?.querySelector(".dropdown-menu");
    if (!parent || !menu) return;
    let t;
    parent.addEventListener("mouseenter", () => { if (!isMobile()) { clearTimeout(t); parent.classList.add("open"); toggle.setAttribute("aria-expanded", "true"); } });
    parent.addEventListener("mouseleave", () => { if (!isMobile()) { t = setTimeout(() => { parent.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }, 250); } });
    toggle.addEventListener("click", (e) => { if (isMobile()) { e.preventDefault(); e.stopPropagation(); const o = parent.classList.toggle("open"); toggle.setAttribute("aria-expanded", o); } });
  });
  window.addEventListener("scroll", () => {
    const nav = document.querySelector(".navbar");
    if (nav) nav.style.background = window.scrollY > 100 ? "rgba(10,10,26,0.95)" : "rgba(10,10,26,0.85)";
  });
}

/* ─── Replay Session Data ───
   Each session represents one curated "solving journey" for a problem,
   reconstructed as a timeline of decision points. Each event marks a
   moment where the solver considered, switched, or got stuck on an
   approach — mirroring what a real coding-snapshot tracker would log. */
const SESSIONS = [
  {
    id: "two-sum-detour",
    title: "Two Sum — The HashMap Detour",
    problem: "Two Sum",
    diff: "easy",
    verdict: { type: "solved", label: "✅ Solved (after detour)" },
    timeTaken: "11:20",
    desc: "The solver recognized the optimal HashMap approach early, abandoned it for a sorting-based idea, hit a dead end with index tracking, and eventually returned to HashMap to finish.",
    events: [
      {
        time: "00:45",
        type: "good",
        icon: "fa-lightbulb",
        label: "Considered HashMap approach",
        note: "Correctly identified that a HashMap could give O(n) lookup for the complement value. This was the right instinct."
      },
      {
        time: "02:10",
        type: "bad",
        icon: "fa-shuffle",
        label: "Switched to Brute Force",
        note: "Second-guessed the HashMap idea, worried about edge cases with duplicate values, and reverted to a simple nested loop instead — losing the optimal path."
      },
      {
        time: "04:45",
        type: "neutral",
        icon: "fa-arrows-left-right",
        label: "Tried sorting + two pointers",
        note: "Attempted to optimize by sorting the array and using two pointers. This works, but breaks original index tracking — a common trap for this problem."
      },
      {
        time: "07:30",
        type: "bad",
        icon: "fa-triangle-exclamation",
        label: "Stuck on index mismatch",
        note: "Spent several minutes trying to recover original indices after sorting, adding unnecessary complexity that the HashMap approach never required."
      },
      {
        time: "09:15",
        type: "good",
        icon: "fa-rotate-left",
        label: "Returned to HashMap idea",
        note: "Abandoned the sorting approach and rewrote the solution using a HashMap — the same idea considered at 00:45, just 8 minutes later."
      },
      {
        time: "11:20",
        type: "good",
        icon: "fa-check",
        label: "Accepted — O(n) HashMap solution",
        note: "Final submission passed all test cases. Total time lost to the detour: roughly 7 minutes."
      }
    ],
    feedback: [
      "You identified the optimal approach (HashMap) within the first minute — trust that instinct more.",
      "The switch to brute force and then sorting cost about 7 minutes without improving the solution quality.",
      "Pattern to watch: when you're unsure about an optimal approach's edge cases, validate with a quick mental test case before abandoning it entirely.",
      "Next time you see 'pair sum' or 'complement lookup' problems, HashMap should be your first instinct — and this session shows you already have it."
    ]
  },
  {
    id: "max-subarray-tle",
    title: "Maximum Subarray — The TLE Loop",
    problem: "Maximum Subarray",
    diff: "medium",
    verdict: { type: "tle", label: "⏱ Time Limit Exceeded" },
    timeTaken: "14:50",
    desc: "The solver never considered Kadane's Algorithm and stayed locked into nested-loop thinking for the entire session, resulting in a TLE on large inputs.",
    events: [
      {
        time: "00:30",
        type: "neutral",
        icon: "fa-layer-group",
        label: "Started with brute force (O(n³))",
        note: "Began with the most obvious approach — checking every possible subarray and summing it directly."
      },
      {
        time: "03:15",
        type: "neutral",
        icon: "fa-gauge-high",
        label: "Optimized inner loop to O(n²)",
        note: "Removed the innermost summing loop by carrying a running sum — a reasonable first optimization, but still quadratic."
      },
      {
        time: "08:30",
        type: "bad",
        icon: "fa-clock",
        label: "Encountered TLE on submission",
        note: "Submitted the O(n²) solution against a large test case (n = 10⁵) and hit the time limit. The solver did not have a way to test against worst-case input sizes beforehand."
      },
      {
        time: "10:00",
        type: "bad",
        icon: "fa-question",
        label: "Re-attempted same O(n²) logic with micro-optimizations",
        note: "Tried shaving time off the existing O(n²) approach (early breaks, variable reuse) instead of reconsidering the algorithm itself — these changes don't fix the underlying complexity."
      },
      {
        time: "14:50",
        type: "bad",
        icon: "fa-xmark",
        label: "Session ended — still O(n²), still TLE",
        note: "Kadane's Algorithm (O(n)) was never considered. The 'running sum, reset on negative' insight is the key idea this session was missing."
      }
    ],
    feedback: [
      "The entire session stayed within O(n²) thinking — no pivot toward a fundamentally different approach was attempted.",
      "When you hit a TLE, that's a signal to question the complexity class itself, not just micro-optimize the same algorithm.",
      "Kadane's Algorithm key idea: if your running sum goes negative, it can only hurt future sums — reset it to zero. This single insight drops the problem to O(n).",
      "Recommendation: after any TLE, ask 'is there a one-pass approach?' before touching the existing code again."
    ]
  },
  {
    id: "longest-substring-overthink",
    title: "Longest Substring — Overthinking the Window",
    problem: "Longest Substring Without Repeating Characters",
    diff: "medium",
    verdict: { type: "wrong", label: "❌ Wrong Answer (off-by-one)" },
    timeTaken: "09:40",
    desc: "The solver had the right sliding window idea from the start but introduced a subtle off-by-one bug while handling the window shrink condition, and never traced through a manual example to catch it.",
    events: [
      {
        time: "00:20",
        type: "good",
        icon: "fa-lightbulb",
        label: "Identified sliding window pattern",
        note: "Correctly recognized this as a classic two-pointer / sliding window problem within the first 20 seconds."
      },
      {
        time: "02:00",
        type: "good",
        icon: "fa-code",
        label: "Implemented Set-based window tracking",
        note: "Used a Set to track characters in the current window — a valid, commonly accepted approach for this problem."
      },
      {
        time: "05:10",
        type: "bad",
        icon: "fa-bug",
        label: "Introduced off-by-one in shrink condition",
        note: "While shrinking the window on a duplicate, the left pointer was incremented before removing the old character from the Set, causing the wrong character to be evicted."
      },
      {
        time: "07:00",
        type: "neutral",
        icon: "fa-magnifying-glass",
        label: "Re-read code, did not trace manually",
        note: "Reviewed the code visually for a couple of minutes but never manually walked through a small example like 'abba' — which would have surfaced the bug immediately."
      },
      {
        time: "09:40",
        type: "bad",
        icon: "fa-xmark",
        label: "Submitted — Wrong Answer on edge case",
        note: "Failed on inputs with repeated patterns close together, exactly the case a manual dry run on 'abba' would have caught."
      }
    ],
    feedback: [
      "Your pattern recognition was excellent — sliding window was identified almost instantly.",
      "The bug was a sequencing issue: characters must be removed from the Set before moving the left pointer, not after.",
      "When a solution looks correct but fails, a 60-second manual trace on a short, tricky input (like 'abba' or 'pwwkew') is often faster than re-reading code silently.",
      "This is a 'good idea, bad execution' session — the fix is process, not algorithm knowledge."
    ]
  }
];

let currentSession = null;
let replayTimer = null;
let replayIndex = 0;

/* ─── Render session summary + timeline skeleton ─── */
function renderSession(session) {
  currentSession = session;
  resetReplay();

  document.getElementById("wtrSessionTitle").textContent = session.title;

  document.getElementById("wtrSessionMeta").innerHTML = `
    <span>${session.problem}</span>
    <span>${session.diff}</span>
    <span><i class="fas fa-stopwatch"></i> ${session.timeTaken}</span>
  `;

  const verdictEl = document.getElementById("wtrVerdict");
  verdictEl.textContent = session.verdict.label;
  verdictEl.className = `wtr-verdict ${session.verdict.type}`;

  document.getElementById("wtrSessionDesc").textContent = session.desc;

  const timeline = document.getElementById("wtrTimeline");
  timeline.innerHTML = session.events.map((ev, i) => `
    <div class="wtr-event ${ev.type}" data-index="${i}">
      <div class="wtr-event-dot"></div>
      <div class="wtr-event-row">
        <span class="wtr-event-time">${ev.time}</span>
        <span class="wtr-event-label"><i class="fas ${ev.icon} wtr-event-icon"></i>${ev.label}</span>
      </div>
      <div class="wtr-event-note">${ev.note}</div>
    </div>
  `).join("");

  const feedbackCard = document.getElementById("wtrFeedbackCard");
  feedbackCard.classList.remove("visible");

  document.getElementById("wtrFeedbackBody").innerHTML =
    `<ul>${session.feedback.map(f => `<li>${f}</li>`).join("")}</ul>`;
}

/* ─── Replay playback logic ─── */
function playReplay() {
  if (!currentSession) return;
  resetReplay();

  const playBtn = document.getElementById("wtrPlayBtn");
  playBtn.disabled = true;
  playBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Playing...`;

  const speed = parseInt(document.getElementById("wtrSpeed").value, 10);
  const events = document.querySelectorAll(".wtr-event");

  function revealNext() {
    if (replayIndex >= events.length) {
      playBtn.disabled = false;
      playBtn.innerHTML = `<i class="fas fa-play"></i> Play Replay`;
      const feedbackCard = document.getElementById("wtrFeedbackCard");
      feedbackCard.classList.add("visible");
      feedbackCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
    events[replayIndex].classList.add("revealed");
    events[replayIndex].scrollIntoView({ behavior: "smooth", block: "center" });
    replayIndex++;
    replayTimer = setTimeout(revealNext, speed);
  }

  revealNext();
}

function resetReplay() {
  clearTimeout(replayTimer);
  replayIndex = 0;
  document.querySelectorAll(".wtr-event").forEach(ev => ev.classList.remove("revealed"));
  document.getElementById("wtrFeedbackCard")?.classList.remove("visible");
  const playBtn = document.getElementById("wtrPlayBtn");
  if (playBtn) {
    playBtn.disabled = false;
    playBtn.innerHTML = `<i class="fas fa-play"></i> Play Replay`;
  }
}

/* ─── Init ─── */
function initReplay() {
  const tabsEl = document.getElementById("wtrSessionTabs");
  if (!tabsEl) return;

  let active = SESSIONS[0].id;

  tabsEl.innerHTML = SESSIONS.map(s => `
    <button
      class="wtr-session-tab${s.id === active ? " active" : ""}"
      data-id="${s.id}"
      role="tab"
      aria-selected="${s.id === active ? "true" : "false"}"
      aria-controls="wtrSessionCard"
      aria-label="View replay for ${s.title}">
      ${s.problem}
    </button>`).join("");

  tabsEl.querySelectorAll(".wtr-session-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      tabsEl.querySelectorAll(".wtr-session-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      active = tab.dataset.id;
      const session = SESSIONS.find(s => s.id === active);
      renderSession(session);
    });
  });

  document.getElementById("wtrPlayBtn")?.addEventListener("click", playReplay);
  document.getElementById("wtrResetBtn")?.addEventListener("click", resetReplay);

  renderSession(SESSIONS[0]);
}
