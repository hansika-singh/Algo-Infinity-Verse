// learning-insights-dashboard.js
// This script powers the Learning Insights Dashboard (weekly view)
// It re-uses chart drawing logic (line & radar) directly to avoid module loading complexities.

// ---------------------------------------------------------------------
// Utility: LocalStorage progress handling (same as personal dashboard)
// ---------------------------------------------------------------------
const STORAGE_KEY = "algoInfinityVerse";
function readProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}
function formatPercent(value) {
  return `${Math.round(Math.max(0, Math.min(100, value || 0)))}%`;
}

// ---------------------------------------------------------------------
// Data extraction helpers (adapted from personal dashboard)
// ---------------------------------------------------------------------
const TOPICS = [
  { key: "arrays", label: "Arrays" },
  { key: "strings", label: "Strings" },
  { key: "linkedlist", label: "Linked Lists" },
  { key: "trees", label: "Trees" },
  { key: "graphs", label: "Graphs" },
  { key: "dp", label: "Dynamic Programming" },
];

function topicLabel(key) {
  return TOPICS.find((t) => t.key === key)?.label || key;
}

function getTopicStats(progress) {
  const quizScores = progress.quizScores || {};
  const quizAttempts = progress.quizAttempts || [];
  const attemptedTotals = new Map();
  quizAttempts.forEach((attempt) => {
    const key = attempt.topicKey;
    if (!key) return;
    const cur = attemptedTotals.get(key) || { correct: 0, total: 0, attempts: 0 };
    cur.correct += Number(attempt.score || 0);
    cur.total += Number(attempt.total || 0);
    cur.attempts += 1;
    attemptedTotals.set(key, cur);
  });
  return TOPICS.map((topic) => {
    const summary = quizScores[topic.key] || { bestScore: 0, attempts: 0, totalXP: 0 };
    const attemptSummary = attemptedTotals.get(topic.key) || { correct: 0, total: 0, attempts: summary.attempts || 0 };
    const accuracy = attemptSummary.total > 0 ? (attemptSummary.correct / attemptSummary.total) * 100 : Number(summary.bestScore || 0);
    return {
      ...topic,
      attempts: attemptSummary.attempts || summary.attempts || 0,
      bestScore: Number(summary.bestScore || 0),
      accuracy: Number.isFinite(accuracy) ? accuracy : 0,
      xp: Number(summary.totalXP || 0),
    };
  });
}

function getQuizAccuracy(progress) {
  const attempts = progress.quizAttempts || [];
  if (attempts.length) {
    const correct = attempts.reduce((s, a) => s + Number(a.score || 0), 0);
    const total = attempts.reduce((s, a) => s + Number(a.total || 0), 0);
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  }
  const topics = getTopicStats(progress).filter((t) => t.attempts > 0);
  if (!topics.length) return 0;
  const total = topics.reduce((s, t) => s + t.attempts, 0);
  const weighted = topics.reduce((s, t) => s + t.bestScore * t.attempts, 0);
  return total > 0 ? Math.round(weighted / total) : 0;
}

function getXpHistory(progress) {
  const history = Array.isArray(progress.xpHistory) ? progress.xpHistory.slice() : [];
  if (!history.length) return [{ label: "Today", value: Number(progress.xp || 0), delta: Number(progress.xp || 0) }];
  const grouped = new Map();
  history.forEach((entry) => {
    const d = new Date(entry.timestamp || Date.now());
    const key = d.toDateString();
    const cur = grouped.get(key) || { label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), delta: 0, value: 0 };
    cur.delta += Number(entry.amount || 0);
    grouped.set(key, cur);
  });
  const ordered = Array.from(grouped.entries()).sort((a, b) => new Date(a[0]) - new Date(b[0]));
  let running = 0;
  return ordered.map(([, pt]) => {
    running += pt.delta;
    return { ...pt, value: running };
  });
}

function getPracticeFrequency(progress) {
  const activityData = progress.activityData || {};
  const days = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const count = Number(activityData[key] || 0);
    days.push({
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      fullLabel: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      value: count,
    });
  }
  return days;
}

function getRecommendations(topicStats, practiceDays, progress) {
  const weakest = topicStats
    .filter((t) => t.attempts > 0)
    .sort((a, b) => a.accuracy - b.accuracy || a.attempts - b.attempts)
    .slice(0, 3);
  const nextTopics = weakest.length ? weakest : topicStats.slice(0, 3);
  const inactiveDays = practiceDays.filter((d) => d.value === 0).length;
  const accuracy = getQuizAccuracy(progress);
  const items = [];
  nextTopics.forEach((topic, idx) => {
    const reason = idx === 0 ? "Primary focus" : idx === 1 ? "Secondary focus" : "Reinforcement";
    items.push({
      title: topicLabel(topic.key),
      text: `Practice ${topicLabel(topic.key).toLowerCase()} problems and quizzes to raise accuracy from ${formatPercent(topic.accuracy)}.`,
      meta: reason,
    });
  });
  if (accuracy < 70) {
    items.push({ title: "Accuracy drill", text: "Review low‑scoring quiz questions and retake them until accuracy exceeds 70%.", meta: "Accuracy focus" });
  }
  if (inactiveDays >= 4) {
    items.push({ title: "Frequency boost", text: "Aim for at least 3 practice sessions in the next 5 days to keep momentum.", meta: "Consistency" });
  }
  return items.slice(0, 4);
}

// ---------------------------------------------------------------------
// Chart drawing functions (copied from modules/chartUtils.js for self‑containment)
// ---------------------------------------------------------------------
function drawLineChart(svg, points, color = "#38bdf8") {
  if (!svg) return;
  const width = 720;
  const height = 260;
  svg.innerHTML = "";
  if (!points.length) {
    svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="rgba(226,232,240,0.65)" font-size="16">No history yet</text>';
    return;
  }
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const padding = 28;
  const step = points.length === 1 ? 0 : (width - padding * 2) / (points.length - 1);
  const mapped = points.map((point, i) => {
    const x = padding + step * i;
    const y = height - padding - ((point.value - min) / range) * (height - padding * 2);
    return { x, y, point };
  });
  const areaPoints = [`${padding},${height - padding}`]
    .concat(mapped.map((m) => `${m.x},${m.y}`))
    .concat(`${width - padding},${height - padding}`)
    .join(" ");
  const linePoints = mapped.map((m) => `${m.x},${m.y}`).join(" ");
  svg.innerHTML = `
    <defs>
      <linearGradient id="xpGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.34" />
        <stop offset="100%" stop-color="${color}" stop-opacity="0.02" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="720" height="260" fill="transparent"></rect>
    <polyline points="${areaPoints}" fill="url(#xpGradient)" stroke="none"></polyline>
    <polyline points="${linePoints}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></polyline>
    ${mapped.map((m) => `<circle cx="${m.x}" cy="${m.y}" r="5.5" fill="${color}" stroke="#020617" stroke-width="2"></circle>`).join("")}
    ${points.map((p, i) => `<text x="${mapped[i].x}" y="${height - 10}" text-anchor="middle" fill="rgba(226,232,240,0.7)" font-size="12">${p.label}</text>`).join("")}
  `;
}

function drawRadarChart(svg, topicStats) {
  if (!svg) return;
  svg.innerHTML = "";
  const points = topicStats.map((t) => ({ label: t.label, value: Math.max(10, Math.min(100, t.attempts ? t.accuracy : 18)) }));
  if (!points.length) {
    svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="rgba(226,232,240,0.65)" font-size="16">No topic data yet</text>';
    return;
  }
  const center = 180;
  const radius = 120;
  const levels = [0.25, 0.5, 0.75, 1];
  const angleStep = (Math.PI * 2) / points.length;
  const polygonPoints = (mult) =>
    points
      .map((p, i) => {
        const angle = -Math.PI / 2 + angleStep * i;
        const x = center + Math.cos(angle) * radius * mult;
        const y = center + Math.sin(angle) * radius * mult;
        return `${x},${y}`;
      })
      .join(" ");
  const dataPoints = points
    .map((p, i) => {
      const angle = -Math.PI / 2 + angleStep * i;
      const dist = radius * (p.value / 100);
      const x = center + Math.cos(angle) * dist;
      const y = center + Math.sin(angle) * dist;
      return `${x},${y}`;
    })
    .join(" ");
  const spokes = points
    .map((p, i) => {
      const angle = -Math.PI / 2 + angleStep * i;
      const x = center + Math.cos(angle) * radius;
      const y = center + Math.sin(angle) * radius;
      const labelX = center + Math.cos(angle) * (radius + 26);
      const labelY = center + Math.sin(angle) * (radius + 26);
      return `
        <line x1="${center}" y1="${center}" x2="${x}" y2="${y}" stroke="rgba(148,163,184,0.18)" />
        <text x="${labelX}" y="${labelY}" text-anchor="middle" dominant-baseline="middle" fill="rgba(226,232,240,0.78)" font-size="11">${p.label}</text>
      `;
    })
    .join("");
  svg.innerHTML = `
    ${levels.map((l) => `<polygon points="${polygonPoints(l)}" fill="none" stroke="rgba(148,163,184,0.15)" />`).join("")}
    ${spokes}
    <polygon points="${dataPoints}" fill="rgba(56,189,248,0.24)" stroke="#38bdf8" stroke-width="3" stroke-linejoin="round"></polygon>
    ${points
      .map((p, i) => {
        const angle = -Math.PI / 2 + angleStep * i;
        const dist = radius * (p.value / 100);
        const x = center + Math.cos(angle) * dist;
        const y = center + Math.sin(angle) * dist;
        return `<circle cx="${x}" cy="${y}" r="4.5" fill="#38bdf8" stroke="#020617" stroke-width="2"></circle>`;
      })
      .join("")}
  `;
}

// ---------------------------------------------------------------------
// Rendering functions (mirroring personal dashboard but weekly scope)
// ---------------------------------------------------------------------
function renderHeroStats(progress, topicStats, quizAccuracy) {
  const heroStats = document.getElementById("heroStats");
  if (!heroStats) return;
  const practiceDays = Object.keys(progress.activityData || {}).length;
  const strongest = topicStats.filter((t) => t.attempts > 0).sort((a, b) => b.accuracy - a.accuracy)[0];
  const weakest = topicStats.filter((t) => t.attempts > 0).sort((a, b) => a.accuracy - b.accuracy)[0];
  heroStats.innerHTML = [
    { label: "Total XP", value: formatNumber(progress.xp), note: "Earned locally" },
    { label: "Quiz accuracy", value: formatPercent(quizAccuracy), note: "Across all attempts" },
    { label: "Practice days", value: formatNumber(practiceDays), note: "Tracked in calendar" },
    { label: "Completed problems", value: formatNumber((progress.completedProblems || []).length), note: "Solved problems" },
  ]
    .map((it) => `
      <div class="hero-stat">
        <span>${it.label}</span>
        <strong>${it.value}</strong>
        <span>${it.note}</span>
      </div>
    `)
    .join("");
  // Update dynamic pills used elsewhere (still present in DOM from other pages, safe to ignore if missing)
  const accBadge = document.getElementById("accuracyBadge");
  if (accBadge) accBadge.textContent = `${formatPercent(quizAccuracy)} accuracy`;
  const strongEl = document.getElementById("strongestTopic");
  if (strongEl) strongEl.textContent = strongest ? `${topicLabel(strongest.key)} (${formatPercent(strongest.accuracy)})` : "No topic data yet";
  const weakEl = document.getElementById("weakestTopic");
  if (weakEl) weakEl.textContent = weakest ? `${topicLabel(weakest.key)} (${formatPercent(weakest.accuracy)})` : "No topic data yet";
}

function renderTopicBars(topicStats) {
  const container = document.getElementById("topicBars");
  if (!container) return;
  const active = topicStats.filter((t) => t.attempts > 0);
  container.innerHTML = active.length
    ? active
        .map(
          (t) => `
        <div class="topic-row">
          <div class="topic-row-head">
            <strong>${t.label}</strong>
            <span>${formatPercent(t.accuracy)} · ${t.attempts} attempts</span>
          </div>
          <div class="topic-track"><div class="topic-fill" style="width:${Math.max(8, t.accuracy)}%"></div></div>
        </div>
      `
        )
        .join("")
    : '<p class="empty-state">Complete a few quizzes to reveal topic strengths and weaknesses.</p>';
}

function renderPracticeFrequency(practiceDays) {
  const container = document.getElementById("practiceFrequency");
  if (!container) return;
  const max = Math.max(1, ...practiceDays.map((d) => d.value));
  const activeDays = practiceDays.filter((d) => d.value > 0).length;
  const streakEl = document.getElementById("practiceStreak");
  if (streakEl) streakEl.textContent = `${activeDays} active days`;
  container.innerHTML = practiceDays
    .map(
      (d) => `
    <div class="frequency-day" title="${d.fullLabel}: ${d.value} sessions">
      <div class="frequency-bar" style="height:${18 + (d.value / max) * 122}px; opacity:${0.35 + (d.value / max) * 0.65}"></div>
      <span class="frequency-label">${d.label}</span>
    </div>
  `
    )
    .join("");
}

function renderRecommendations(topicStats, practiceDays, progress) {
  const container = document.getElementById("recommendationsList");
  if (!container) return;
  const recs = getRecommendations(topicStats, practiceDays, progress);
  container.innerHTML = recs.length
    ? recs
        .map(
          (r) => `
        <div class="recommendation-item">
          <strong>${r.title}</strong>
          <p>${r.text}</p>
          <div class="drilldown-meta"><span>${r.meta}</span></div>
        </div>
      `
        )
        .join("")
    : '<p class="empty-state">Finish one quiz to unlock personalized recommendations.</p>';
}

function renderTopicDrilldown(topicStats) {
  const container = document.getElementById("topicDrilldown");
  if (!container) return;
  container.innerHTML = topicStats
    .map(
      (t) => `
    <div class="drilldown-item">
      <strong>${t.label}</strong>
      <p>${t.attempts ? `${formatPercent(t.accuracy)} accuracy over ${t.attempts} quiz attempts.` : "No quiz attempts yet."}</p>
      <div class="drilldown-meta">
        <span>Best score: ${formatPercent(t.bestScore)}</span>
        <span>XP from quizzes: ${formatNumber(t.xp)}</span>
      </div>
    </div>
  `
    )
    .join("");
}

function renderDashboard() {
  const progress = readProgress();
  const topicStats = getTopicStats(progress);
  const quizAccuracy = getQuizAccuracy(progress);
  // Weekly XP: take last 7 entries from history (or fewer)
  const xpSeriesFull = getXpHistory(progress);
  const xpSeries = xpSeriesFull.slice(-7);
  const practiceDays = getPracticeFrequency(progress);

  renderHeroStats(progress, topicStats, quizAccuracy);
  renderTopicBars(topicStats);
  renderRecommendations(topicStats, practiceDays, progress);
  renderTopicDrilldown(topicStats);
  drawLineChart(document.getElementById("xpChart"), xpSeries, "#38bdf8");
  drawRadarChart(document.getElementById("topicRadar"), topicStats);

  const first = xpSeries[0];
  const last = xpSeries[xpSeries.length - 1];
  const delta = last && first ? last.value - first.value : Number(progress.xp || 0);
  const xpDelta = document.getElementById("xpDelta");
  if (xpDelta) xpDelta.textContent = `${delta >= 0 ? "+" : ""}${formatNumber(delta)} this week`;
}

function initDashboard() {
  renderDashboard();
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) renderDashboard();
  });
  // Refresh every 8 seconds like the original dashboard for live updates.
  window.setInterval(renderDashboard, 8000);
}

document.addEventListener("DOMContentLoaded", () => {
  // Load navbar & footer partials
  const loadPartial = (id, url) => {
    const target = document.getElementById(id);
    if (!target) return Promise.resolve();
    return fetch(url)
      .then((r) => r.text())
      .then((html) => {
        target.innerHTML = html;
      })
      .catch(() => {
        target.innerHTML = "";
      });
  };
  loadPartial("navbar-placeholder", "/partials/navbar.html").then(() => {
    if (typeof initNavbar === "function") initNavbar();
  });
  loadPartial("footer-placeholder", "/partials/footer.html");
  initDashboard();
});
