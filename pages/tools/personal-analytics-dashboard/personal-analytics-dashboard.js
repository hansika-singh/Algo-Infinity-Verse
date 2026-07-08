const STORAGE_KEY = "algoInfinityVerse";
const TOPICS = [
  { key: "arrays", label: "Arrays" },
  { key: "strings", label: "Strings" },
  { key: "linkedlist", label: "Linked Lists" },
  { key: "trees", label: "Trees" },
  { key: "graphs", label: "Graphs" },
  { key: "dp", label: "Dynamic Programming" },
];

function loadPartial(id, url) {
  const target = document.getElementById(id);
  if (!target) return Promise.resolve();
  return fetch(url)
    .then((response) => response.text())
    .then((html) => {
      target.innerHTML = html;
    })
    .catch(() => {
      target.innerHTML = "";
    });
}

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

function topicLabel(key) {
  return TOPICS.find((topic) => topic.key === key)?.label || key;
}

function getTopicStats(progress) {
  const quizScores = progress.quizScores || {};
  const quizAttempts = progress.quizAttempts || [];
  const attemptedTotals = new Map();

  quizAttempts.forEach((attempt) => {
    const key = attempt.topicKey;
    if (!key) return;
    const current = attemptedTotals.get(key) || { correct: 0, total: 0, attempts: 0 };
    current.correct += Number(attempt.score || 0);
    current.total += Number(attempt.total || 0);
    current.attempts += 1;
    attemptedTotals.set(key, current);
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
    const correct = attempts.reduce((sum, item) => sum + Number(item.score || 0), 0);
    const total = attempts.reduce((sum, item) => sum + Number(item.total || 0), 0);
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  }

  const topics = getTopicStats(progress).filter((topic) => topic.attempts > 0);
  if (!topics.length) return 0;
  const total = topics.reduce((sum, topic) => sum + topic.attempts, 0);
  const weighted = topics.reduce((sum, topic) => sum + topic.bestScore * topic.attempts, 0);
  return total > 0 ? Math.round(weighted / total) : 0;
}

function getXpHistory(progress) {
  const history = Array.isArray(progress.xpHistory) ? progress.xpHistory.slice() : [];
  if (!history.length) {
    return [{ label: "Today", value: Number(progress.xp || 0), delta: Number(progress.xp || 0) }];
  }

  const grouped = new Map();
  history.forEach((entry) => {
    const date = new Date(entry.timestamp || Date.now());
    const key = date.toDateString();
    const current = grouped.get(key) || { label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }), delta: 0, value: 0 };
    current.delta += Number(entry.amount || 0);
    grouped.set(key, current);
  });

  const ordered = Array.from(grouped.entries()).sort((a, b) => new Date(a[0]) - new Date(b[0]));
  let running = 0;
  return ordered.map(([, point]) => {
    running += point.delta;
    return { ...point, value: running };
  });
}

function getPracticeFrequency(progress) {
  const activityData = progress.activityData || {};
  const days = [];
  const today = new Date();
  for (let i = 13; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const count = Number(activityData[key] || 0);
    days.push({
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      fullLabel: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      value: count,
    });
  }
  return days;
}

function getRecommendations(topicStats, practiceDays, progress) {
  const weakest = topicStats
    .filter((topic) => topic.attempts > 0)
    .sort((a, b) => a.accuracy - b.accuracy || a.attempts - b.attempts)
    .slice(0, 3);

  const nextTopics = weakest.length ? weakest : topicStats.slice(0, 3);
  const inactiveDays = practiceDays.filter((day) => day.value === 0).length;
  const accuracy = getQuizAccuracy(progress);

  const items = [];
  nextTopics.forEach((topic, index) => {
    const reason = index === 0 ? "Primary focus area" : index === 1 ? "Secondary weakness" : "Reinforcement topic";
    items.push({
      title: topicLabel(topic.key),
      text: `Practice ${topicLabel(topic.key).toLowerCase()} problems and quiz questions to raise accuracy from ${formatPercent(topic.accuracy)}.`,
      meta: reason,
    });
  });

  if (accuracy < 70) {
    items.push({
      title: "Accuracy drill",
      text: "Revisit solved quizzes, compare wrong answers, and retake low-scoring topics until accuracy passes 70%.",
      meta: "Accuracy focus",
    });
  }

  if (inactiveDays >= 4) {
    items.push({
      title: "Frequency boost",
      text: "Complete a short practice session on at least 3 of the next 5 days to stabilize your learning rhythm.",
      meta: "Consistency focus",
    });
  }

  return items.slice(0, 4);
}

function drawLineChart(svg, points, color = "#38bdf8") {
  if (!svg) return;
  const width = 720;
  const height = 260;
  svg.innerHTML = "";

  if (!points.length) {
    svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="rgba(226,232,240,0.65)" font-size="16">No history yet</text>';
    return;
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const padding = 28;
  const step = points.length === 1 ? 0 : (width - padding * 2) / (points.length - 1);

  const mapped = points.map((point, index) => {
    const x = padding + step * index;
    const y = height - padding - ((point.value - min) / range) * (height - padding * 2);
    return { x, y, point };
  });

  const areaPoints = [`${padding},${height - padding}`].concat(mapped.map((item) => `${item.x},${item.y}`), [`${width - padding},${height - padding}`]).join(" ");
  const linePoints = mapped.map((item) => `${item.x},${item.y}`).join(" ");

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
    ${mapped.map((item) => `<circle cx="${item.x}" cy="${item.y}" r="5.5" fill="${color}" stroke="#020617" stroke-width="2"></circle>`).join("")}
    ${points.map((point, index) => `<text x="${mapped[index].x}" y="${height - 10}" text-anchor="middle" fill="rgba(226,232,240,0.7)" font-size="12">${point.label}</text>`).join("")}
  `;
}

function drawRadarChart(svg, topicStats) {
  if (!svg) return;
  svg.innerHTML = "";
  const points = topicStats.map((topic) => ({
    label: topic.label,
    value: Math.max(10, Math.min(100, topic.attempts ? topic.accuracy : 18)),
  }));

  if (!points.length) {
    svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="rgba(226,232,240,0.65)" font-size="16">No topic data yet</text>';
    return;
  }

  const center = 180;
  const radius = 120;
  const levels = [0.25, 0.5, 0.75, 1];
  const angleStep = (Math.PI * 2) / points.length;

  const polygonPoints = (multiplier) => points.map((point, index) => {
    const angle = -Math.PI / 2 + angleStep * index;
    const x = center + Math.cos(angle) * radius * multiplier;
    const y = center + Math.sin(angle) * radius * multiplier;
    return `${x},${y}`;
  }).join(" ");

  const dataPoints = points.map((point, index) => {
    const angle = -Math.PI / 2 + angleStep * index;
    const distance = radius * (point.value / 100);
    const x = center + Math.cos(angle) * distance;
    const y = center + Math.sin(angle) * distance;
    return `${x},${y}`;
  }).join(" ");

  const spokes = points.map((point, index) => {
    const angle = -Math.PI / 2 + angleStep * index;
    const x = center + Math.cos(angle) * radius;
    const y = center + Math.sin(angle) * radius;
    const labelX = center + Math.cos(angle) * (radius + 26);
    const labelY = center + Math.sin(angle) * (radius + 26);
    return `
      <line x1="${center}" y1="${center}" x2="${x}" y2="${y}" stroke="rgba(148,163,184,0.18)" />
      <text x="${labelX}" y="${labelY}" text-anchor="middle" dominant-baseline="middle" fill="rgba(226,232,240,0.78)" font-size="11">${point.label}</text>
    `;
  }).join("");

  svg.innerHTML = `
    ${levels.map((level) => `<polygon points="${polygonPoints(level)}" fill="none" stroke="rgba(148,163,184,0.15)" />`).join("")}
    ${spokes}
    <polygon points="${dataPoints}" fill="rgba(56,189,248,0.24)" stroke="#38bdf8" stroke-width="3" stroke-linejoin="round"></polygon>
    ${points.map((point, index) => {
      const angle = -Math.PI / 2 + angleStep * index;
      const distance = radius * (point.value / 100);
      const x = center + Math.cos(angle) * distance;
      const y = center + Math.sin(angle) * distance;
      return `<circle cx="${x}" cy="${y}" r="4.5" fill="#38bdf8" stroke="#020617" stroke-width="2"></circle>`;
    }).join("")}
  `;
}

function renderHeroStats(progress, topicStats, quizAccuracy) {
  const heroStats = document.getElementById("heroStats");
  if (!heroStats) return;
  const practiceDays = Object.keys(progress.activityData || {}).length;
  const strongest = topicStats.filter((topic) => topic.attempts > 0).sort((a, b) => b.accuracy - a.accuracy)[0];
  const weakest = topicStats.filter((topic) => topic.attempts > 0).sort((a, b) => a.accuracy - b.accuracy)[0];

  heroStats.innerHTML = [
    { label: "Total XP", value: formatNumber(progress.xp), note: "Earned locally" },
    { label: "Quiz accuracy", value: formatPercent(quizAccuracy), note: "Across all attempts" },
    { label: "Practice days", value: formatNumber(practiceDays), note: "Tracked in the calendar" },
    { label: "Completed problems", value: formatNumber((progress.completedProblems || []).length), note: "Solved problems" },
  ].map((item) => `
    <div class="hero-stat">
      <span>${item.label}</span>
      <strong>${item.value}</strong>
      <span>${item.note}</span>
    </div>
  `).join("");

  document.getElementById("accuracyBadge").textContent = `${formatPercent(quizAccuracy)} accuracy`;
  document.getElementById("strongestTopic").textContent = strongest ? `${topicLabel(strongest.key)} (${formatPercent(strongest.accuracy)})` : "No topic data yet";
  document.getElementById("weakestTopic").textContent = weakest ? `${topicLabel(weakest.key)} (${formatPercent(weakest.accuracy)})` : "No topic data yet";
}

function renderTopicBars(topicStats) {
  const container = document.getElementById("topicBars");
  if (!container) return;
  const activeTopics = topicStats.filter((topic) => topic.attempts > 0);
  container.innerHTML = activeTopics.length
    ? activeTopics.map((topic) => `
      <div class="topic-row">
        <div class="topic-row-head">
          <strong>${topic.label}</strong>
          <span>${formatPercent(topic.accuracy)} · ${topic.attempts} attempts</span>
        </div>
        <div class="topic-track"><div class="topic-fill" style="width:${Math.max(8, topic.accuracy)}%"></div></div>
      </div>
    `).join("")
    : '<p class="empty-state">Complete a few quizzes to reveal topic strengths and weaknesses.</p>';
}

function renderPracticeFrequency(practiceDays) {
  const container = document.getElementById("practiceFrequency");
  if (!container) return;
  const max = Math.max(1, ...practiceDays.map((day) => day.value));
  const activeDays = practiceDays.filter((day) => day.value > 0).length;
  document.getElementById("practiceStreak").textContent = `${activeDays} active days`;
  container.innerHTML = practiceDays.map((day) => `
    <div class="frequency-day" title="${day.fullLabel}: ${day.value} sessions">
      <div class="frequency-bar" style="height:${18 + (day.value / max) * 122}px; opacity:${0.35 + (day.value / max) * 0.65}"></div>
      <span class="frequency-label">${day.label}</span>
    </div>
  `).join("");
}

function renderRecommendations(topicStats, practiceDays, progress) {
  const container = document.getElementById("recommendationsList");
  if (!container) return;
  const recommendations = getRecommendations(topicStats, practiceDays, progress);
  container.innerHTML = recommendations.length
    ? recommendations.map((item) => `
      <div class="recommendation-item">
        <strong>${item.title}</strong>
        <p>${item.text}</p>
        <div class="drilldown-meta"><span>${item.meta}</span></div>
      </div>
    `).join("")
    : '<p class="empty-state">Finish one quiz to unlock personalized recommendations.</p>';
}

function renderTopicDrilldown(topicStats) {
  const container = document.getElementById("topicDrilldown");
  if (!container) return;
  container.innerHTML = topicStats.map((topic) => `
    <div class="drilldown-item">
      <strong>${topic.label}</strong>
      <p>${topic.attempts ? `${formatPercent(topic.accuracy)} accuracy over ${topic.attempts} quiz attempts.` : "No quiz attempts yet."}</p>
      <div class="drilldown-meta">
        <span>Best score: ${formatPercent(topic.bestScore)}</span>
        <span>XP from quizzes: ${formatNumber(topic.xp)}</span>
      </div>
    </div>
  `).join("");
}

function renderDashboard() {
  const progress = readProgress();
  const topicStats = getTopicStats(progress);
  const quizAccuracy = getQuizAccuracy(progress);
  const xpSeries = getXpHistory(progress).slice(-12);
  const practiceDays = getPracticeFrequency(progress);

  renderHeroStats(progress, topicStats, quizAccuracy);
  renderTopicBars(topicStats);
  renderRecommendations(topicStats, practiceDays, progress);
  renderTopicDrilldown(topicStats);
  drawLineChart(document.getElementById("xpChart"), xpSeries, "#38bdf8");
  drawRadarChart(document.getElementById("topicRadar"), topicStats);

  const lastPoint = xpSeries[xpSeries.length - 1];
  const firstPoint = xpSeries[0];
  const delta = lastPoint && firstPoint ? lastPoint.value - firstPoint.value : Number(progress.xp || 0);
  const xpDelta = document.getElementById("xpDelta");
  if (xpDelta) xpDelta.textContent = `${delta >= 0 ? "+" : ""}${formatNumber(delta)} in view`;
}

function initDashboard() {
  renderDashboard();
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) renderDashboard();
  });
  window.setInterval(renderDashboard, 8000);
}

document.addEventListener("DOMContentLoaded", () => {
  loadPartial("navbar-placeholder", "/partials/navbar.html").then(() => {
    if (typeof initNavbar === "function") initNavbar();
  });
  loadPartial("footer-placeholder", "/partials/footer.html");
  initDashboard();
});
