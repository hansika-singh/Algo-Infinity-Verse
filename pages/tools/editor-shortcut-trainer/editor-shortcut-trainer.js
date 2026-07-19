/**
 * Keyboard Shortcut Trainer (Code Editor Focus)
 * Separate interactive game — inspired by, not coupled to, modules/keyboard-shortcuts.js
 */
(function () {
  'use strict';

  const BEST_STREAK_KEY = 'aivEditorShortcutBestStreak';
  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || '') ||
    (navigator.userAgentData && navigator.userAgentData.platform === 'macOS');
  const modLabel = isMac ? '⌘' : 'Ctrl';
  const altLabel = isMac ? '⌥' : 'Alt';
  const shiftLabel = 'Shift';

  /**
   * match: function(e) => boolean
   * display: keys shown to the user
   * core: included in "core only" mode
   */
  const SHORTCUTS = [
    {
      id: 'run',
      action: 'Run code',
      desc: 'Execute the current editor buffer (VS Code / many playgrounds).',
      core: true,
      display: [modLabel, 'Enter'],
      match: (e) => (e.ctrlKey || e.metaKey) && !e.altKey && e.key === 'Enter',
    },
    {
      id: 'format',
      action: 'Format document',
      desc: 'Auto-format the file with the default formatter.',
      core: true,
      display: [modLabel, shiftLabel, 'F'],
      match: (e) => (e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey && e.key.toLowerCase() === 'f',
    },
    {
      id: 'comment',
      action: 'Toggle line comment',
      desc: 'Comment or uncomment the current line(s).',
      core: true,
      display: [modLabel, '/'],
      match: (e) => (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === '/' || e.code === 'Slash'),
    },
    {
      id: 'undo',
      action: 'Undo',
      desc: 'Undo the last edit.',
      core: true,
      display: [modLabel, 'Z'],
      match: (e) => (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'z',
    },
    {
      id: 'redo',
      action: 'Redo',
      desc: 'Redo the last undone edit.',
      core: false,
      display: isMac ? [modLabel, shiftLabel, 'Z'] : [modLabel, 'Y'],
      match: (e) => {
        if (!(e.ctrlKey || e.metaKey) || e.altKey) return false;
        if (isMac) return e.shiftKey && e.key.toLowerCase() === 'z';
        return !e.shiftKey && e.key.toLowerCase() === 'y';
      },
    },
    {
      id: 'save',
      action: 'Save file',
      desc: 'Save the current file.',
      core: false,
      display: [modLabel, 'S'],
      match: (e) => (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 's',
    },
    {
      id: 'find',
      action: 'Find',
      desc: 'Open find in the current editor.',
      core: false,
      display: [modLabel, 'F'],
      match: (e) => (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'f',
    },
    {
      id: 'replace',
      action: 'Replace',
      desc: 'Open find and replace.',
      core: false,
      display: [modLabel, 'H'],
      match: (e) => (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'h',
    },
    {
      id: 'selectAll',
      action: 'Select all',
      desc: 'Select the entire buffer.',
      core: false,
      display: [modLabel, 'A'],
      match: (e) => (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'a',
    },
    {
      id: 'cut',
      action: 'Cut',
      desc: 'Cut selection to clipboard.',
      core: false,
      display: [modLabel, 'X'],
      match: (e) => (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'x',
    },
    {
      id: 'copy',
      action: 'Copy',
      desc: 'Copy selection to clipboard.',
      core: false,
      display: [modLabel, 'C'],
      match: (e) => (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'c',
    },
    {
      id: 'paste',
      action: 'Paste',
      desc: 'Paste from clipboard.',
      core: false,
      display: [modLabel, 'V'],
      match: (e) => (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'v',
    },
    {
      id: 'duplicate',
      action: 'Duplicate line',
      desc: 'Duplicate the current line (VS Code).',
      core: false,
      display: [shiftLabel, altLabel, '↓'],
      match: (e) => e.shiftKey && e.altKey && !e.ctrlKey && !e.metaKey && e.key === 'ArrowDown',
    },
    {
      id: 'commandPalette',
      action: 'Command palette',
      desc: 'Open the editor command palette.',
      core: false,
      display: [modLabel, shiftLabel, 'P'],
      match: (e) => (e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey && e.key.toLowerCase() === 'p',
    },
  ];

  let playing = false;
  let score = 0;
  let streak = 0;
  let bestStreak = Number(localStorage.getItem(BEST_STREAK_KEY) || 0);
  let round = 0;
  let current = null;
  let lastId = null;
  let locked = false;
  let timedEndsAt = 0;
  let timerId = null;
  let correctThisRound = 0;
  let attemptsThisRound = 0;

  function $(id) {
    return document.getElementById(id);
  }

  function renderKeys(container, keys, muted) {
    if (!container) return;
    if (!keys || !keys.length) {
      container.innerHTML = `<span class="est-key muted">Waiting…</span>`;
      return;
    }
    container.innerHTML = keys
      .map((k, i) => {
        const key = `<span class="est-key${muted ? ' muted' : ''}">${escapeHtml(k)}</span>`;
        const plus = i < keys.length - 1 ? '<span class="est-key plus">+</span>' : '';
        return key + plus;
      })
      .join('');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function updateStats() {
    $('estScore').textContent = score;
    $('estStreak').textContent = streak;
    $('estBest').textContent = bestStreak;
    $('estRound').textContent = round;
  }

  function buildCheatSheet() {
    const list = $('estCheatList');
    list.innerHTML = SHORTCUTS.map(
      (s) => `<li><span>${escapeHtml(s.action)}</span><span class="keys">${escapeHtml(s.display.join(' + '))}</span></li>`,
    ).join('');
  }

  function poolForMode() {
    const mode = $('estMode').value;
    if (mode === 'core') return SHORTCUTS.filter((s) => s.core);
    return SHORTCUTS.slice();
  }

  function pickNext() {
    const pool = poolForMode();
    let choice = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1) {
      let guard = 0;
      while (choice.id === lastId && guard < 8) {
        choice = pool[Math.floor(Math.random() * pool.length)];
        guard += 1;
      }
    }
    lastId = choice.id;
    return choice;
  }

  function showFeedback(ok, message) {
    const el = $('estFeedback');
    const arena = document.querySelector('.est-arena');
    el.textContent = message;
    el.className = 'est-feedback ' + (ok ? 'good' : 'bad');
    if (arena) {
      arena.classList.remove('pulse-good', 'pulse-bad');
      void arena.offsetWidth;
      arena.classList.add(ok ? 'pulse-good' : 'pulse-bad');
      setTimeout(() => arena.classList.remove('pulse-good', 'pulse-bad'), 350);
    }
  }

  function presentPrompt() {
    current = pickNext();
    round += 1;
    locked = false;
    updateStats();
    $('estPrompt').textContent = current.action;
    $('estPromptDesc').textContent = current.desc;
    renderKeys($('estKeysTarget'), current.display, false);
    renderKeys($('estKeysLive'), null, true);
    $('estFeedback').textContent = '';
    $('estFeedback').className = 'est-feedback';
  }

  function keysFromEvent(e) {
    const parts = [];
    if (e.ctrlKey || e.metaKey) parts.push(modLabel);
    if (e.altKey) parts.push(altLabel);
    if (e.shiftKey) parts.push(shiftLabel);
    let key = e.key;
    if (key === ' ') key = 'Space';
    if (key === 'ArrowDown') key = '↓';
    if (key === 'ArrowUp') key = '↑';
    if (key === 'ArrowLeft') key = '←';
    if (key === 'ArrowRight') key = '→';
    if (key === 'Enter') key = 'Enter';
    if (key.length === 1) key = key.toUpperCase();
    if (!['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) {
      parts.push(key);
    }
    return parts;
  }

  function onCorrect() {
    locked = true;
    attemptsThisRound += 1;
    correctThisRound += 1;
    streak += 1;
    bestStreak = Math.max(bestStreak, streak);
    localStorage.setItem(BEST_STREAK_KEY, String(bestStreak));
    const bonus = Math.min(streak, 5);
    score += 10 + bonus;
    updateStats();
    showFeedback(true, `Correct! +${10 + bonus} (streak ×)`);
    setTimeout(() => {
      if (playing) presentPrompt();
    }, 550);
  }

  function onWrong(e) {
    attemptsThisRound += 1;
    streak = 0;
    updateStats();
    renderKeys($('estKeysLive'), keysFromEvent(e), false);
    showFeedback(false, 'Not quite — try again or press Skip / Next');
  }

  function handleKeydown(e) {
    if (!playing || !current || locked) return;

    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) {
      return;
    }

    // Ignore bare modifier presses
    if (['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) {
      renderKeys($('estKeysLive'), keysFromEvent(e), false);
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      renderKeys($('estKeysLive'), null, true);
      $('estFeedback').textContent = '';
      return;
    }

    // Prevent browser defaults for matching training shortcuts (save, find, etc.)
    e.preventDefault();

    renderKeys($('estKeysLive'), keysFromEvent(e), false);

    if (current.match(e)) {
      onCorrect();
    } else {
      onWrong(e);
    }
  }

  function clearTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    $('estTimerWrap').hidden = true;
  }

  function startTimed() {
    $('estTimerWrap').hidden = false;
    timedEndsAt = Date.now() + 60000;
    const fill = $('estTimerFill');
    const secEl = $('estTimerSec');
    fill.style.width = '100%';
    timerId = setInterval(() => {
      const left = Math.max(0, timedEndsAt - Date.now());
      const sec = Math.ceil(left / 1000);
      secEl.textContent = String(sec);
      fill.style.width = `${(left / 60000) * 100}%`;
      if (left <= 0) {
        endRound('Time is up!');
      }
    }, 100);
  }

  function setPlayingUI(on) {
    playing = on;
    $('estIdle').hidden = on;
    $('estPlay').hidden = !on;
    $('estRoundOver').hidden = true;
    $('estStartBtn').disabled = on;
    $('estNextBtn').disabled = !on;
    $('estRestartBtn').disabled = !on;
    $('estMode').disabled = on;
  }

  function startGame() {
    score = 0;
    streak = 0;
    round = 0;
    correctThisRound = 0;
    attemptsThisRound = 0;
    lastId = null;
    clearTimer();
    setPlayingUI(true);
    updateStats();
    presentPrompt();
    if ($('estMode').value === 'timed') startTimed();
    document.querySelector('.est-arena')?.focus?.();
  }

  function endRound(reason) {
    playing = false;
    locked = true;
    clearTimer();
    $('estPlay').hidden = true;
    $('estIdle').hidden = true;
    $('estRoundOver').hidden = false;
    $('estStartBtn').disabled = false;
    $('estNextBtn').disabled = true;
    $('estRestartBtn').disabled = false;
    $('estMode').disabled = false;
    const acc = attemptsThisRound
      ? Math.round((correctThisRound / attemptsThisRound) * 100)
      : 0;
    $('estRoundSummary').textContent =
      `${reason} Score ${score} · ${correctThisRound} correct · best streak ${bestStreak} · accuracy ${acc}%`;
  }

  function skipPrompt() {
    if (!playing) return;
    streak = 0;
    attemptsThisRound += 1;
    updateStats();
    showFeedback(false, `Skipped — answer was ${current.display.join(' + ')}`);
    locked = true;
    setTimeout(() => {
      if (playing) presentPrompt();
    }, 700);
  }

  function init() {
    $('estModHint').textContent = isMac
      ? 'Mac detected — use ⌘ / ⌥ shortcuts'
      : 'Use Ctrl shortcuts (⌘ also accepted)';
    buildCheatSheet();
    updateStats();

    $('estStartBtn').addEventListener('click', startGame);
    $('estRestartBtn').addEventListener('click', startGame);
    $('estPlayAgainBtn').addEventListener('click', startGame);
    $('estNextBtn').addEventListener('click', skipPrompt);

    document.addEventListener('keydown', handleKeydown);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
