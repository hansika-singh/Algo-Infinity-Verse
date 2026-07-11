document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initScrollTop();
  initFutureSelfSimulator();
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

/* ─────────────────────────────────────────────
   Future Self Simulator — Spaced Repetition Engine

   Uses a simplified SM-2 algorithm (the same family of algorithm used
   by Anki and SuperMemo, and referenced elsewhere in this project's
   Memory Scanner feature) to schedule revisions, combined with an
   Ebbinghaus-style exponential decay model to estimate "forgetting
   risk" — the probability a topic has been forgotten as of right now,
   based on how long it's been since last review relative to the
   current SM-2 interval.

    All data is stored client-side in localStorage.
   ───────────────────────────────────────────── */

const STORAGE_KEY = "futureSelfSimulator";

/* ─── SM-2 core ───
   quality: 0-5 self-rated recall quality
   Returns updated { easeFactor, intervalDays, repetitions } */
function applySM2({ easeFactor, intervalDays, repetitions }, quality) {
  let newEase = easeFactor;
  let newInterval;
  let newRepetitions = repetitions;

  if (quality < 3) {
    // Failed recall — reset repetitions, review again very soon
    newRepetitions = 0;
    newInterval = 1;
  } else {
    newRepetitions = repetitions + 1;
    if (newRepetitions === 1) newInterval = 1;
    else if (newRepetitions === 2) newInterval = 6;
    else newInterval = Math.round(intervalDays * newEase);
  }

  // Ease factor adjustment (standard SM-2 formula)
  newEase = newEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEase < 1.3) newEase = 1.3;

  return {
    easeFactor: Math.round(newEase * 100) / 100,
    intervalDays: Math.max(1, newInterval),
    repetitions: newRepetitions
  };
}

/* ─── Forgetting risk model ───
   Approximates the Ebbinghaus forgetting curve: risk grows as the
   fraction of elapsed time vs the scheduled interval increases,
   modeled as 1 - e^(-k * elapsedRatio). Once a topic is overdue
   (elapsedRatio >= 1) risk climbs steeply toward 100%. */
function calculateForgettingRisk(card) {
  const now = Date.now();
  const elapsedDays = (now - card.lastReviewed) / (1000 * 60 * 60 * 24);
  const elapsedRatio = elapsedDays / card.intervalDays;

  // k tuned so risk crosses ~50% right around the scheduled review date
  const k = 0.7;
  const risk = 1 - Math.exp(-k * elapsedRatio);

  return Math.min(99, Math.max(1, Math.round(risk * 100)));
}

function getRiskTier(riskPct) {
  if (riskPct >= 80) return "critical";
  if (riskPct >= 55) return "high";
  if (riskPct >= 30) return "medium";
  return "low";
}

/* ─── Storage helpers ─── */
function loadCards() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c) =>
        c &&
        typeof c.topic === "string" &&
        typeof c.lastReviewed === "number" &&
        typeof c.easeFactor === "number" &&
        typeof c.intervalDays === "number" &&
        typeof c.repetitions === "number"
    );
  } catch {
    return [];
  }
}

function saveCards(cards) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

function findCardIndex(cards, topic) {
  const normalized = topic.trim().toLowerCase();
  return cards.findIndex(c => c.topic.trim().toLowerCase() === normalized);
}

/* ─── Logging a session ─── */
function logTopicSession(topic, quality) {
  const cards = loadCards();
  const now = Date.now();
  const existingIndex = findCardIndex(cards, topic);

  if (existingIndex >= 0) {
    const existing = cards[existingIndex];
    const updated = applySM2(existing, quality);
    cards[existingIndex] = {
      ...existing,
      ...updated,
      lastReviewed: now
    };
  } else {
    const updated = applySM2({ easeFactor: 2.5, intervalDays: 1, repetitions: 0 }, quality);
    cards.push({
      topic: topic.trim(),
      lastReviewed: now,
      easeFactor: updated.easeFactor,
      intervalDays: updated.intervalDays,
      repetitions: updated.repetitions
    });
  }

  saveCards(cards);
  return cards;
}

function deleteTopic(topic) {
  const cards = loadCards();
  const index = findCardIndex(cards, topic);
  if (index >= 0) {
    cards.splice(index, 1);
    saveCards(cards);
  }
  return cards;
}

/* ─── Rendering ─── */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatRelativeDate(timestamp) {
  const days = Math.max(0, Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24)));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function renderRiskBars(cards) {
  const container = document.getElementById("fssRiskBars");

  if (cards.length === 0) {
    container.innerHTML = `<p class="fss-empty-state">No topics logged yet. Add one above to see your forgetting risk.</p>`;
    return;
  }

  const withRisk = cards
    .map(c => ({ ...c, risk: calculateForgettingRisk(c) }))
    .sort((a, b) => b.risk - a.risk);

  container.innerHTML = withRisk.map(c => `
    <div class="fss-risk-row">
      <div class="fss-risk-label" title="${escapeHtml(c.topic)}">${escapeHtml(c.topic)}</div>
      <div class="fss-risk-track">
        <div class="fss-risk-fill ${getRiskTier(c.risk)}" style="width:0" data-pct="${c.risk}">${c.risk}%</div>
      </div>
    </div>
  `).join("");

  requestAnimationFrame(() => {
    setTimeout(() => {
      container.querySelectorAll(".fss-risk-fill").forEach(bar => {
        bar.style.width = bar.dataset.pct + "%";
      });
    }, 100);
  });
}

function renderSchedule(cards) {
  const container = document.getElementById("fssScheduleList");

  if (cards.length === 0) {
    container.innerHTML = `<p class="fss-empty-state">Your revision plan will appear here once you log topics.</p>`;
    return;
  }

  const withRisk = cards.map(c => ({ ...c, risk: calculateForgettingRisk(c) }));

  // "Today" = overdue or high risk, "Tomorrow" = approaching, "Later" = comfortably scheduled
  const today = withRisk.filter(c => c.risk >= 70).sort((a, b) => b.risk - a.risk);
  const tomorrow = withRisk.filter(c => c.risk >= 40 && c.risk < 70).sort((a, b) => b.risk - a.risk);
  const later = withRisk.filter(c => c.risk < 40).sort((a, b) => b.risk - a.risk);

  const sections = [
    { label: "Today", cls: "day-today", items: today },
    { label: "Tomorrow", cls: "day-tomorrow", items: tomorrow },
    { label: "This week", cls: "day-later", items: later }
  ].filter(s => s.items.length > 0);

  if (sections.length === 0) {
    container.innerHTML = `<p class="fss-empty-state">Nothing urgent — you're on top of your revisions!</p>`;
    return;
  }

  container.innerHTML = sections.flatMap(section =>
    section.items.map(item => `
      <div class="fss-schedule-item ${section.cls}">
        <div class="fss-schedule-day">${section.label}</div>
        <div class="fss-schedule-topic">${escapeHtml(item.topic)}</div>
        <div class="fss-schedule-risk">${item.risk}% risk</div>
      </div>
    `)
  ).join("");
}

function renderTopicsList(cards) {
  const container = document.getElementById("fssTopicsList");

  if (cards.length === 0) {
    container.innerHTML = `<p class="fss-empty-state">No topics tracked yet.</p>`;
    return;
  }

  const withRisk = cards
    .map(c => ({ ...c, risk: calculateForgettingRisk(c) }))
    .sort((a, b) => b.risk - a.risk);

  container.innerHTML = withRisk.map(c => `
    <div class="fss-topic-row" data-topic="${escapeHtml(c.topic)}">
      <div class="fss-topic-info">
        <span class="fss-topic-name">${escapeHtml(c.topic)}</span>
        <span class="fss-topic-meta">
          Last reviewed ${formatRelativeDate(c.lastReviewed)} &middot;
          Next interval: ${c.intervalDays} day${c.intervalDays !== 1 ? "s" : ""} &middot;
          Ease: ${c.easeFactor}
        </span>
      </div>
      <span class="fss-topic-badge ${getRiskTier(c.risk)}">${c.risk}% risk</span>
      <button class="fss-topic-delete" aria-label="Remove ${escapeHtml(c.topic)}" data-action="delete">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `).join("");

  container.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener("click", () => {
      const row = btn.closest(".fss-topic-row");
      const topic = row.dataset.topic;
      const updated = deleteTopic(topic);
      renderAll(updated);
    });
  });
}

function renderAll(cards) {
  renderRiskBars(cards);
  renderSchedule(cards);
  renderTopicsList(cards);
}

/* ─── Form handling ─── */
function showLogMessage(text, type) {
  const el = document.getElementById("fssLogMessage");
  el.textContent = text;
  el.className = `fss-log-hint ${type}`;
}

function initFutureSelfSimulator() {
  const form = document.getElementById("fssLogForm");
  const topicInput = document.getElementById("fssTopicInput");
  const qualityInput = document.getElementById("fssQualityInput");
  const clearBtn = document.getElementById("fssClearBtn");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const topic = topicInput.value.trim();
    const quality = qualityInput.value;

    if (!topic) {
      showLogMessage("Please enter a topic name.", "error");
      return;
    }
    if (quality === "") {
      showLogMessage("Please select a recall rating.", "error");
      return;
    }

    const updated = logTopicSession(topic, Number(quality));
    const card = updated[findCardIndex(updated, topic)];
    const nextDate = new Date(card.lastReviewed + card.intervalDays * 86400000);

    showLogMessage(
      `Logged "${topic}". Next review recommended in ${card.intervalDays} day${card.intervalDays !== 1 ? "s" : ""} (around ${nextDate.toLocaleDateString()}).`,
      "success"
    );

    form.reset();
    renderAll(updated);
  });

  clearBtn?.addEventListener("click", () => {
    if (!false /* confirm removed */) return;
    localStorage.removeItem(STORAGE_KEY);
    renderAll([]);
    showLogMessage("All data cleared.", "success");
  });

  renderAll(loadCards());
}
