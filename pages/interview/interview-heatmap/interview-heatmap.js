document.addEventListener("DOMContentLoaded", () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  initHeatmapTracker();
});

function initLoadingScreen() {
  setTimeout(() => { const s = document.getElementById("loading-screen"); if (s) s.classList.add("hidden"); }, 1500);
}

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

/* ─────────────────────────────────────────────
   Interview Heatmap — Tracking Engine

   Tracks real mouse position + scroll behavior while the user
   interacts with the mock problem workspace. Time spent "attending"
   to each zone (statement, constraints, examples, coding area) is
   accumulated based on where the cursor currently sits, sampled on
   a fixed interval. This is a lightweight client-side approximation
   of attention tracking — no external analytics or server calls.
   ───────────────────────────────────────────── */

const ZONE_IDS = ["statement", "constraints", "examples", "coding"];
const ZONE_LABELS = {
  statement:   "Problem Statement",
  constraints: "Constraints",
  examples:    "Examples",
  coding:      "Coding Area"
};
const ZONE_ICONS = {
  statement:   "fa-file-lines",
  constraints: "fa-list-check",
  examples:    "fa-flask",
  coding:      "fa-code"
};

const SAMPLE_INTERVAL_MS = 200; // how often we record which zone the mouse is in

let trackingState = {
  active: false,
  startTime: null,
  endTime: null,
  zoneTime: {},      // ms spent with cursor inside each zone
  zoneScrollEvents: {}, // scroll event count while inside each zone
  currentZone: null,
  sampleTimer: null,
  mouseX: 0,
  mouseY: 0,
  totalScrollEvents: 0
};

function resetTrackingState() {
  clearInterval(trackingState.sampleTimer);
  trackingState = {
    active: false,
    startTime: null,
    endTime: null,
    zoneTime: ZONE_IDS.reduce((acc, z) => ({ ...acc, [z]: 0 }), {}),
    zoneScrollEvents: ZONE_IDS.reduce((acc, z) => ({ ...acc, [z]: 0 }), {}),
    currentZone: null,
    sampleTimer: null,
    mouseX: 0,
    mouseY: 0,
    totalScrollEvents: 0
  };
}

/* Determine which zone the mouse is currently over, if any */
function getZoneUnderMouse(x, y) {
  for (const zoneId of ZONE_IDS) {
    const el = document.getElementById(`zone${capitalize(zoneId)}`);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return zoneId;
    }
  }
  return null;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function handleMouseMove(e) {
  trackingState.mouseX = e.clientX;
  trackingState.mouseY = e.clientY;
}

function handleScroll() {
  if (!trackingState.active) return;
  trackingState.totalScrollEvents++;
  const zone = getZoneUnderMouse(trackingState.mouseX, trackingState.mouseY);
  if (zone) {
    trackingState.zoneScrollEvents[zone] = (trackingState.zoneScrollEvents[zone] || 0) + 1;
  }
}

function sampleZone() {
  if (!trackingState.active) return;
  const zone = getZoneUnderMouse(trackingState.mouseX, trackingState.mouseY);
  if (zone) {
    trackingState.zoneTime[zone] = (trackingState.zoneTime[zone] || 0) + SAMPLE_INTERVAL_MS;
  }
  trackingState.currentZone = zone;
  updateActiveZoneHighlight(zone);
}

function updateActiveZoneHighlight(activeZone) {
  ZONE_IDS.forEach(zoneId => {
    const el = document.getElementById(`zone${capitalize(zoneId)}`);
    if (!el) return;
    el.classList.toggle("ihm-zone-active", zoneId === activeZone);
  });
}

/* ─── Session controls ─── */
function startSession() {
  resetTrackingState();
  trackingState.active = true;
  trackingState.startTime = Date.now();

  document.getElementById("ihmStatusDot")?.classList.add("active");
  document.getElementById("ihmStatusText").textContent = "Tracking in progress — solve the problem above";
  document.getElementById("ihmStartBtn").disabled = true;
  document.getElementById("ihmReportBtn").disabled = false;
  document.getElementById("ihmReportCard")?.classList.remove("visible");

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("scroll", handleScroll, true);
  trackingState.sampleTimer = setInterval(sampleZone, SAMPLE_INTERVAL_MS);
}

function stopSession() {
  trackingState.active = false;
  trackingState.endTime = Date.now();
  clearInterval(trackingState.sampleTimer);
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("scroll", handleScroll, true);
  updateActiveZoneHighlight(null);

  document.getElementById("ihmStatusDot")?.classList.remove("active");
  document.getElementById("ihmStatusText").textContent = "Session ended — report generated below";
  document.getElementById("ihmReportBtn").disabled = true;
}

function resetSession() {
  stopSession();
  resetTrackingState();
  document.getElementById("ihmStatusText").textContent = "Tracking not started";
  document.getElementById("ihmStartBtn").disabled = false;
  document.getElementById("ihmReportBtn").disabled = true;
  document.getElementById("ihmReportCard")?.classList.remove("visible");
  document.getElementById("ihmCodeArea").value = "";
}

/* ─── Report generation ─── */
function generateReport() {
  stopSession();

  const totalTrackedMs = ZONE_IDS.reduce((sum, z) => sum + trackingState.zoneTime[z], 0);
  const elapsedSec = Math.max(1, Math.round((trackingState.endTime - trackingState.startTime) / 1000));

  // Compute percentage distribution; fall back gracefully if no movement was tracked
  const percentages = {};
  ZONE_IDS.forEach(zoneId => {
    percentages[zoneId] = totalTrackedMs > 0
      ? Math.round((trackingState.zoneTime[zoneId] / totalTrackedMs) * 100)
      : 0;
  });

  renderHeatmapBars(percentages);
  renderStatsGrid(percentages, elapsedSec);
  renderObservations(percentages);

  document.getElementById("ihmReportDuration").textContent =
    `Session duration: ${formatDuration(elapsedSec)}`;

  const reportCard = document.getElementById("ihmReportCard");
  reportCard.classList.add("visible");
  reportCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

function formatDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function renderHeatmapBars(percentages) {
  const container = document.getElementById("ihmHeatmapBars");
  container.innerHTML = ZONE_IDS.map(zoneId => `
    <div class="ihm-bar-row">
      <div class="ihm-bar-label"><i class="fas ${ZONE_ICONS[zoneId]}"></i>${ZONE_LABELS[zoneId]}</div>
      <div class="ihm-bar-track">
        <div class="ihm-bar-fill ${zoneId}" style="width:0" data-pct="${percentages[zoneId]}">${percentages[zoneId]}%</div>
      </div>
    </div>
  `).join("");

  requestAnimationFrame(() => {
    setTimeout(() => {
      container.querySelectorAll(".ihm-bar-fill").forEach(bar => {
        bar.style.width = bar.dataset.pct + "%";
      });
    }, 100);
  });
}

function renderStatsGrid(percentages, elapsedSec) {
  const totalScroll = trackingState.totalScrollEvents;
  const dominantZone = ZONE_IDS.reduce((max, z) =>
    percentages[z] > percentages[max] ? z : max, ZONE_IDS[0]);
  const weakestZone = ZONE_IDS.reduce((min, z) =>
    percentages[z] < percentages[min] ? z : min, ZONE_IDS[0]);

  const stats = [
    { label: "Total Time", value: formatDuration(elapsedSec), color: "var(--text-primary)" },
    { label: "Scroll Events", value: totalScroll, color: "var(--text-primary)" },
    { label: "Most Attention", value: ZONE_LABELS[dominantZone], color: "#22c55e" },
    { label: "Least Attention", value: ZONE_LABELS[weakestZone], color: "#ef4444" }
  ];

  document.getElementById("ihmStatsGrid").innerHTML = stats.map(s => `
    <div class="ihm-stat-box">
      <div class="ihm-stat-value" style="color:${s.color}">${s.value}</div>
      <div class="ihm-stat-label">${s.label}</div>
    </div>
  `).join("");
}

function renderObservations(percentages) {
  const observations = [];

  if (percentages.constraints < 10) {
    observations.push("Constraints received very little attention. Skipping edge cases here is a common source of wrong answers in real interviews — try reading them before writing code.");
  }
  if (percentages.examples < 10) {
    observations.push("Examples were barely reviewed. Tracing through given examples manually often reveals the right approach before you write any code.");
  }
  if (percentages.coding > 60) {
    observations.push("Most of your time was spent in the coding area. This can indicate jumping into implementation before fully understanding the problem — consider planning your approach first.");
  }
  if (percentages.statement > 50 && percentages.coding < 15) {
    observations.push("You spent a lot of time re-reading the problem statement but wrote very little code. This may suggest you were unsure how to start — try sketching a brute-force approach early to build momentum.");
  }
  if (trackingState.totalScrollEvents < 3) {
    observations.push("Very little scrolling was detected. Make sure you're not missing content below the fold, especially in longer problem statements.");
  }
  if (observations.length === 0) {
    observations.push("Your attention was fairly balanced across all sections — no major behavioral red flags detected in this session.");
  }

  document.getElementById("ihmObservationsList").innerHTML =
    observations.map(o => `<li>${o}</li>`).join("");
}

/* ─── Init ─── */
function initHeatmapTracker() {
  resetTrackingState();

  document.getElementById("ihmStartBtn")?.addEventListener("click", startSession);
  document.getElementById("ihmReportBtn")?.addEventListener("click", generateReport);
  document.getElementById("ihmResetBtn")?.addEventListener("click", resetSession);
}
