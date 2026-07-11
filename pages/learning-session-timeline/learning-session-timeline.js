const qs = (sel) => document.querySelector(sel);

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function iconForType(type) {
  const t = String(type);
  if (t.startsWith('problem_')) return 'fa-solid fa-square-check';
  if (t.startsWith('quiz_')) return 'fa-solid fa-circle-question';
  if (t.includes('xp')) return 'fa-solid fa-bolt';
  if (t.includes('badge')) return 'fa-solid fa-award';
  if (t.includes('topic')) return 'fa-solid fa-book-open';
  if (t.includes('playground')) return 'fa-solid fa-terminal';
  return 'fa-solid fa-stream';
}

function titleForType(type) {
  switch (type) {
    case 'problem_attempted':
      return 'Problem attempted';
    case 'problem_solved':
      return 'Problem solved';
    case 'quiz_attempted':
      return 'Quiz attempt';
    case 'xp_earned':
      return 'XP earned';
    case 'badge_unlocked':
      return 'Badge unlocked';
    case 'topic_visited':
      return 'Topic visited';
    case 'code_playground_used':
      return 'Code Playground used';
    default:
      return String(type);
  }
}

function descForType(type, payload = {}) {
  const p = payload || {};

  if (type.startsWith('problem_')) {
    return `Problem: ${p.problemId || p.problem_key || p.title || '(unknown)'}`;
  }
  if (type.startsWith('quiz_')) {
    return `Quiz: ${p.quizTitle || p.quizId || '(unknown)'} • Score: ${p.percentage ?? p.score ?? '-'}`;
  }
  if (type === 'xp_earned') {
    return `+${p.amount ?? '?'} XP • Source: ${p.source || 'unknown'}`;
  }
  if (type === 'badge_unlocked') {
    return `Badge: ${p.badgeName || p.badge || '(unknown)'}`;
  }
  if (type === 'topic_visited') {
    return `Topic: ${p.topicKey || p.topic || '(unknown)'}`;
  }
  if (type === 'code_playground_used') {
    return `Activity: ${p.action || 'run'} • Playground: ${p.playground || 'default'}`;
  }

  const keys = Object.keys(p);
  if (keys.length === 0) return '';
  return keys
    .slice(0, 4)
    .map((k) => `${k}: ${p[k]}`)
    .join(' • ');
}

async function apiJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data?.error || data?.message || `Request failed: ${res.status}`;
    throw new Error(err);
  }
  return data;
}

async function ensureSession() {
  try {
    await apiJson('/api/learning-sessions/ensure', {
      method: 'POST',
      body: JSON.stringify({ eventType: 'timeline_opened' }),
    });
  } catch {
    // best effort
  }
}

async function fetchSessions(limit = 30) {
  return apiJson(`/api/learning-sessions?limit=${limit}`, { method: 'GET' });
}

async function fetchTimeline(sessionId) {
  return apiJson(`/api/learning-sessions/${encodeURIComponent(sessionId)}`, { method: 'GET' });
}

function renderSessions(container, sessions) {
  container.innerHTML = '';

  const emptyState = qs('#emptyState');
  if (!sessions || sessions.length === 0) {
    emptyState?.classList.remove('hidden');
    return;
  }
  emptyState?.classList.add('hidden');

  sessions.forEach((s) => {
    const item = document.createElement('div');
    item.className = 'lst-session-item';
    item.dataset.sessionId = s.id;

    const startedAt = s.startedAt ? formatTime(s.startedAt) : '';
    const stats = s.stats || {};

    item.innerHTML = `
      <div class="lst-session-top">
        <p class="lst-session-title">Session</p>
        <span class="lst-session-time">${escapeHtml(startedAt)}</span>
      </div>
      <div class="lst-session-stats">
        <div class="lst-mini"><span class="k">Solved</span><span class="v">${stats.problemsSolved ?? 0}</span></div>
        <div class="lst-mini"><span class="k">XP</span><span class="v">${stats.xpEarned ?? 0}</span></div>
        <div class="lst-mini"><span class="k">Quizzes</span><span class="v">${stats.quizAttempts ?? 0}</span></div>
      </div>
    `;

    item.addEventListener('click', async () => {
      document.querySelectorAll('.lst-session-item').forEach((el) => el.classList.remove('active'));
      item.classList.add('active');
      await loadTimeline(sessionIdFromEl(item));
    });

    container.appendChild(item);
  });
}

function sessionIdFromEl(el) {
  return el?.dataset?.sessionId;
}

function renderTimelineList(listEl, timeline, filterKey) {
  listEl.innerHTML = '';

  if (!timeline || timeline.length === 0) {
    listEl.textContent = 'No events recorded in this session yet.';
    return;
  }

  const filter = String(filterKey || 'all');
  const allow = (type) => {
    const t = String(type);
    if (filter === 'all') return true;
    if (filter === 'problem') return t.startsWith('problem_');
    if (filter === 'quiz') return t.startsWith('quiz_');
    if (filter === 'xp') return t.includes('xp');
    if (filter === 'badges') return t.includes('badge');
    if (filter === 'topic') return t.includes('topic');
    if (filter === 'playground') return t.includes('playground');
    return true;
  };

  const filtered = timeline.filter((e) => allow(e.type));

  if (filtered.length === 0) {
    listEl.textContent = `No events match filter: ${filter}.`;
    return;
  }

  filtered.forEach((evt) => {
    const payload = evt.payload || {};

    const row = document.createElement('div');
    row.className = 'lst-event';

    const icon = iconForType(evt.type);
    const title = titleForType(evt.type);
    const desc = descForType(evt.type, payload);

    row.innerHTML = `
      <div class="lst-badge-icon"><i class="${icon}"></i></div>
      <div class="lst-event-content">
        <div class="lst-event-header">
          <p class="lst-event-title">${escapeHtml(title)}</p>
          <span class="lst-event-time">${escapeHtml(formatTime(evt.timestamp))}</span>
        </div>
        ${desc ? `<p class="lst-event-desc">${escapeHtml(desc)}</p>` : ''}
      </div>
    `;

    listEl.appendChild(row);
  });
}

let activeFilter = 'all';
let timelineCache = null;

async function loadTimeline(sessionId) {
  const meta = qs('#timelineMeta');
  const listEl = qs('#timelineList');

  listEl.textContent = 'Loading timeline...';
  meta.textContent = '';

  const data = await fetchTimeline(sessionId);
  timelineCache = data.timeline || [];

  const stats = data.session?.stats || {};
  meta.textContent = `Solved: ${stats.problemsSolved ?? 0} • XP: ${stats.xpEarned ?? 0} • Badges: ${stats.badgesUnlocked ?? 0}`;

  renderTimelineList(listEl, timelineCache, activeFilter);
}

function initFilters() {
  document.querySelectorAll('.lst-filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lst-filter').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      activeFilter = btn.dataset.filter || 'all';
      if (timelineCache) {
        renderTimelineList(qs('#timelineList'), timelineCache, activeFilter);
      }
    });
  });
}

async function init() {
  initFilters();
  await ensureSession();

  const res = await fetchSessions(30);
  const sessions = res?.sessions || [];

  const list = qs('#sessionsList');
  if (list) renderSessions(list, sessions);

  const first = document.querySelector('.lst-session-item');
  if (first) first.click();
}

document.addEventListener('DOMContentLoaded', () => {
  init().catch((err) => {
    const list = qs('#sessionsList');
    if (list) list.innerHTML = `Failed to load sessions: ${escapeHtml(err.message || String(err))}`;
  });
});
