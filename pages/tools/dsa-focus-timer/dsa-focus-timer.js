/**
 * DSA Focus Pomodoro + Topic Tags
 * 25/5 timer with topic-tagged sessions persisted in localStorage.
 */

document.addEventListener('DOMContentLoaded', () => {
  ftInit();
});

const FT_STORAGE_KEY = 'aiv_dsa_focus_sessions';
const FT_DURATIONS = { focus: 25 * 60, break: 5 * 60 };

let ftState = {
  mode: 'focus',
  remaining: FT_DURATIONS.focus,
  total: FT_DURATIONS.focus,
  running: false,
  timerId: null,
  sessions: [],
};

function ftInit() {
  ftState.sessions = ftLoadSessions();

  document.querySelectorAll('.ft-mode').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (ftState.running) ftPause();
      ftSetMode(btn.dataset.mode);
    });
  });

  document.querySelectorAll('.ft-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const topic = chip.dataset.topic;
      const select = document.getElementById('ftTopic');
      select.value = topic;
      ftSyncCustomVisibility();
      ftSyncChips(topic);
    });
  });

  document.getElementById('ftTopic').addEventListener('change', () => {
    ftSyncCustomVisibility();
    ftSyncChips(document.getElementById('ftTopic').value);
  });

  document.getElementById('ftPlayBtn').addEventListener('click', () => ftToggle());
  document.getElementById('ftResetBtn').addEventListener('click', () => ftReset());
  document.getElementById('ftSkipBtn').addEventListener('click', () => ftSkip());
  document.getElementById('ftClearBtn').addEventListener('click', () => ftClearHistory());

  ftSyncCustomVisibility();
  ftSyncChips(document.getElementById('ftTopic').value);
  ftRenderTimer();
  ftRenderAnalytics();
  ftRenderHistory();
}

function ftLoadSessions() {
  try {
    const raw = localStorage.getItem(FT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function ftSaveSessions() {
  localStorage.setItem(FT_STORAGE_KEY, JSON.stringify(ftState.sessions));
}

function ftSetMode(mode) {
  ftState.mode = mode === 'break' ? 'break' : 'focus';
  ftState.total = FT_DURATIONS[ftState.mode];
  ftState.remaining = ftState.total;

  document.querySelectorAll('.ft-mode').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === ftState.mode);
  });
  document.querySelector('.ft-timer-card').classList.toggle('is-break', ftState.mode === 'break');
  document.getElementById('ftModeLabel').textContent =
    ftState.mode === 'focus' ? 'Focus session' : 'Break session';
  ftRenderTimer();
}

function ftSyncCustomVisibility() {
  const isCustom = document.getElementById('ftTopic').value === 'Custom';
  const custom = document.getElementById('ftCustomTopic');
  custom.hidden = !isCustom;
  if (isCustom) custom.focus();
}

function ftSyncChips(topic) {
  document.querySelectorAll('.ft-chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.topic === topic);
  });
}

function ftCurrentTopic() {
  const select = document.getElementById('ftTopic');
  if (select.value === 'Custom') {
    const custom = document.getElementById('ftCustomTopic').value.trim();
    return custom || 'Custom';
  }
  return select.value;
}

function ftToggle() {
  if (ftState.running) ftPause();
  else ftStart();
}

function ftStart() {
  if (ftState.mode === 'focus' && !ftCurrentTopic()) {
    ftSetStatus('Choose a topic tag before focusing.');
    return;
  }
  ftState.running = true;
  const btn = document.getElementById('ftPlayBtn');
  btn.classList.add('ft-playing');
  btn.innerHTML = '<i class="fas fa-pause"></i>';
  btn.setAttribute('aria-label', 'Pause');
  ftSetStatus(
    ftState.mode === 'focus'
      ? `Focusing on ${ftCurrentTopic()}…`
      : 'Break time — stretch, hydrate, come back sharp.'
  );
  ftState.timerId = setInterval(() => ftTick(), 1000);
}

function ftPause() {
  ftState.running = false;
  if (ftState.timerId) {
    clearInterval(ftState.timerId);
    ftState.timerId = null;
  }
  const btn = document.getElementById('ftPlayBtn');
  btn.classList.remove('ft-playing');
  btn.innerHTML = '<i class="fas fa-play"></i>';
  btn.setAttribute('aria-label', 'Start');
  ftSetStatus('Paused.');
}

function ftReset() {
  ftPause();
  ftState.remaining = ftState.total;
  ftRenderTimer();
  ftSetStatus('Timer reset.');
}

function ftSkip() {
  ftPause();
  if (ftState.mode === 'focus' && ftState.remaining < ftState.total) {
    // partial focus not counted — only completed focus blocks
  }
  ftSetMode(ftState.mode === 'focus' ? 'break' : 'focus');
  ftSetStatus(ftState.mode === 'break' ? 'Skipped to break.' : 'Skipped to focus.');
}

function ftTick() {
  if (ftState.remaining <= 1) {
    ftState.remaining = 0;
    ftRenderTimer();
    ftComplete();
    return;
  }
  ftState.remaining -= 1;
  ftRenderTimer();
}

function ftComplete() {
  ftPause();
  const card = document.querySelector('.ft-timer-card');
  card.classList.add('ft-flash');
  setTimeout(() => card.classList.remove('ft-flash'), 900);

  if (document.getElementById('ftSound').checked) {
    ftBeep();
  }

  if (ftState.mode === 'focus') {
    const minutes = Math.round(ftState.total / 60);
    const session = {
      id: `${Date.now()}`,
      topic: ftCurrentTopic(),
      minutes,
      mode: 'focus',
      completedAt: new Date().toISOString(),
    };
    ftState.sessions.unshift(session);
    ftSaveSessions();
    ftRenderAnalytics();
    ftRenderHistory();
    ftSetStatus(`Focus done on ${session.topic} (+${minutes}m). Take a 5-minute break?`);
    ftSetMode('break');
  } else {
    ftSetStatus('Break over — pick a topic and start another focus block.');
    ftSetMode('focus');
  }
}

function ftBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, 220);
  } catch {
    // Audio may be blocked — visual flash still runs
  }
}

function ftRenderTimer() {
  const mins = Math.floor(ftState.remaining / 60);
  const secs = ftState.remaining % 60;
  document.getElementById('ftTime').textContent =
    `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const pct = ((ftState.total - ftState.remaining) / ftState.total) * 100;
  document.getElementById('ftProgress').style.width = `${pct}%`;
}

function ftFormatMinutes(totalMins) {
  if (totalMins < 60) return `${totalMins}m`;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function ftDayKey(iso) {
  return iso.slice(0, 10);
}

function ftComputeStreak(sessions) {
  const days = new Set(sessions.map((s) => ftDayKey(s.completedAt)));
  if (!days.size) return 0;
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!days.has(key)) {
      if (streak === 0) {
        // allow streak to start from yesterday if today empty
        cursor.setDate(cursor.getDate() - 1);
        const yKey = cursor.toISOString().slice(0, 10);
        if (!days.has(yKey)) return 0;
        streak = 1;
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      break;
    }
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function ftRenderAnalytics() {
  const focusSessions = ftState.sessions.filter((s) => s.mode === 'focus');
  const totalMins = focusSessions.reduce((sum, s) => sum + (s.minutes || 0), 0);
  const byTopic = new Map();
  focusSessions.forEach((s) => {
    byTopic.set(s.topic, (byTopic.get(s.topic) || 0) + (s.minutes || 0));
  });

  let topTopic = '—';
  let topMins = 0;
  byTopic.forEach((mins, topic) => {
    if (mins > topMins) {
      topMins = mins;
      topTopic = topic;
    }
  });

  document.getElementById('ftTotalFocus').textContent = ftFormatMinutes(totalMins);
  document.getElementById('ftSessionCount').textContent = String(focusSessions.length);
  document.getElementById('ftStreak').textContent = String(ftComputeStreak(focusSessions));
  document.getElementById('ftTopTopic').textContent = topTopic;

  const bars = document.getElementById('ftTopicBars');
  const sorted = [...byTopic.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (!sorted.length) {
    bars.textContent = 'Complete a focus block to see topic bars.';
    return;
  }
  const max = sorted[0][1] || 1;
  bars.innerHTML = sorted
    .map(([topic, mins]) => {
      const pct = Math.round((mins / max) * 100);
      return `<div class="ft-bar-row">
        <span class="ft-bar-label" title="${ftEscape(topic)}">${ftEscape(topic)}</span>
        <span class="ft-bar-track"><span class="ft-bar-fill" data-w="${pct}"></span></span>
        <span class="ft-bar-value">${mins}m</span>
      </div>`;
    })
    .join('');
  bars.querySelectorAll('.ft-bar-fill').forEach((el) => {
    el.style.width = `${el.dataset.w}%`;
  });
}

function ftRenderHistory() {
  const list = document.getElementById('ftHistory');
  const focusSessions = ftState.sessions.filter((s) => s.mode === 'focus').slice(0, 20);
  list.innerHTML = focusSessions
    .map((s) => {
      const when = new Date(s.completedAt);
      const label = when.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      return `<li class="ft-history-item">
        <span class="ft-history-topic">${ftEscape(s.topic)}</span>
        <span class="ft-history-mins">${s.minutes}m</span>
        <span class="ft-history-meta">${ftEscape(label)}</span>
      </li>`;
    })
    .join('');
}

function ftClearHistory() {
  if (!ftState.sessions.length) {
    ftSetStatus('History already empty.');
    return;
  }
  if (!window.confirm('Clear all saved focus sessions?')) return;
  ftState.sessions = [];
  ftSaveSessions();
  ftRenderAnalytics();
  ftRenderHistory();
  ftSetStatus('History cleared.');
}

function ftSetStatus(message) {
  document.getElementById('ftStatus').textContent = message;
}

function ftEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
