// ── Focus Mode Timer ──────────────────────────────────────────────────────
// Pomodoro-style study timer (25 min default) with state-aware controls:
//   Idle    → Start  button  visible
//   Running → Pause  button  visible
//   Paused  → Resume button  visible
//   Any     → Reset  button  always visible
// The display uses three separate fixed-width spans (minutes, seconds,
// centiseconds) so rapid digit changes in one segment never shift another.
// The study-timer partial is loaded dynamically, so initialization waits for
// the 'partialsLoaded' custom event dispatched by index.html's partial loader.

let focusTimer = null;
let timeLeft = 150000; // 25 minutes in centiseconds (1500 s × 100)
const DEFAULT_DURATION = 150000;
const TICK_MS = 10; // interval in milliseconds (gives centisecond precision)

// ── Display helpers ───────────────────────────────────────────────────────

/** Push the current timeLeft value into each segment span independently. */
function updateTimerDisplay() {
  const totalSeconds = Math.floor(timeLeft / 100);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  const c = timeLeft % 100;

  const minEl = document.getElementById('timer-minutes');
  const secEl = document.getElementById('timer-seconds');
  const csEl  = document.getElementById('timer-centiseconds');

  if (minEl) minEl.textContent = m.toString().padStart(2, '0');
  if (secEl) secEl.textContent = s.toString().padStart(2, '0');
  if (csEl)  csEl.textContent  = c.toString().padStart(2, '0');
}

// ── Button state management ───────────────────────────────────────────────

/**
 * Show or hide the control buttons based on the current timer state.
 *
 *   Idle    (at full duration, not running) → Start
 *   Running (interval active)               → Pause
 *   Paused  (time remaining, not running)   → Resume
 *   Reset   button is always visible.
 */
function syncButtonStates() {
  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const resumeBtn = document.getElementById('resume-btn');

  if (!startBtn || !pauseBtn || !resumeBtn) return;

  const isRunning = focusTimer !== null;
  const isIdle = timeLeft === DEFAULT_DURATION;

  startBtn.style.display  = !isRunning && isIdle  ? '' : 'none';
  pauseBtn.style.display  = isRunning              ? '' : 'none';
  resumeBtn.style.display = !isRunning && !isIdle  ? '' : 'none';
}

// ── Timer actions ─────────────────────────────────────────────────────────

/** Start or resume the countdown. No-op if already running. */
function startTimer() {
  if (focusTimer) return;

  let lastTick = Date.now();
  focusTimer = setInterval(() => {
    const now = Date.now();
    const elapsedCs = Math.floor((now - lastTick) / TICK_MS);
    lastTick = now;

    timeLeft = Math.max(0, timeLeft - elapsedCs);
    updateTimerDisplay();

    if (timeLeft <= 0) {
      clearInterval(focusTimer);
      focusTimer = null;
      timeLeft = DEFAULT_DURATION;
      updateTimerDisplay();
      syncButtonStates();
    }
  }, TICK_MS);

  syncButtonStates();
}

/** Pause the countdown without resetting the remaining time. */
function pauseTimer() {
  if (!focusTimer) return;
  clearInterval(focusTimer);
  focusTimer = null;
  syncButtonStates();
}

/** Resume a paused countdown. Alias for startTimer for semantic clarity. */
function resumeTimer() {
  startTimer();
}

/** Stop the timer and restore the default duration. */
function resetTimer() {
  clearInterval(focusTimer);
  focusTimer = null;
  timeLeft = DEFAULT_DURATION;
  updateTimerDisplay();
  syncButtonStates();
}

// ── Initialisation ────────────────────────────────────────────────────────

/**
 * Bind click handlers to the timer control buttons.
 * Called once the study-timer partial exists in the DOM.
 */
function initTimerControls() {
  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const resumeBtn = document.getElementById('resume-btn');
  const resetBtn = document.getElementById('reset-btn');

  if (!startBtn || !pauseBtn || !resumeBtn || !resetBtn) {
    // Partial hasn't been injected yet — safe to ignore because we only
    // call this after the partialsLoaded event fires.
    return;
  }

  startBtn.addEventListener('click', startTimer);
  pauseBtn.addEventListener('click', pauseTimer);
  resumeBtn.addEventListener('click', resumeTimer);
  resetBtn.addEventListener('click', resetTimer);

  syncButtonStates();
}

// ── Bootstrap ─────────────────────────────────────────────────────────────
// The study-timer HTML partial is injected asynchronously.  index.html's
// partial loader dispatches a 'partialsLoaded' custom event when all
// partials are ready.  If this script runs after that point (e.g. because
// of a hot-reload or a second pass), initialise immediately.

if (document.getElementById('start-btn')) {
  initTimerControls();
} else if (window.partialsLoadedFlag) {
  initTimerControls();
} else {
  document.addEventListener('partialsLoaded', initTimerControls, { once: true });
}
