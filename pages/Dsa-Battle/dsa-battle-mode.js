/* global Y, CodeMirror */
// dsa-battle-mode.js
let currentBattleId = null;
let pollInterval = null;
let currentUserId = null;
let currentUserName = null;
let socket = null;

let isTyping = false;
let typingTimeout = null;
let stateDebounceTimeout = null;
let battleStartTime = null;

// Collaborative CRDT (Yjs) & Editor (CodeMirror) globals
let editor = null;
let ydoc = null;
let ytext = null;
let ybinding = null;
let remoteCursors = new Map();

// Base64 serialization helpers for Yjs update payloads
function uint8ArrayToBase64(uint8Array) {
  let binary = '';
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return window.btoa(binary);
}

function base64ToUint8Array(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Two-way synchronization binding between Y.Text and CodeMirror
class YCodeMirrorBinding {
  constructor(ytext, editor) {
    this.ytext = ytext;
    this.editor = editor;
    this.isApplying = false;

    // Initialize CodeMirror with Yjs content
    this.editor.setValue(this.ytext.toString());

    // Listen to CodeMirror changes
    this.editor.on('change', this.onCodeMirrorChange.bind(this));

    // Listen to Yjs changes
    this.ytext.observe(this.onYjsChange.bind(this));
  }

  onCodeMirrorChange(instance, changeObj) {
    if (this.isApplying) return;
    if (changeObj.origin === '*remote' || changeObj.origin === 'setValue') return;

    this.isApplying = true;
    this.ytext.doc.transact(() => {
      const fromIndex = this.editor.indexFromPos(changeObj.from);
      const removedLength = changeObj.removed.join('\n').length;
      const addedText = changeObj.text.join('\n');

      if (removedLength > 0) {
        this.ytext.delete(fromIndex, removedLength);
      }
      if (addedText.length > 0) {
        this.ytext.insert(fromIndex, addedText);
      }
    }, 'local');
    this.isApplying = false;
  }

  onYjsChange(event) {
    if (this.isApplying) return;
    this.isApplying = true;

    const doc = this.editor.getDoc();
    this.ytext.doc.transact(() => {
      let index = 0;
      event.changes.delta.forEach((op) => {
        if (op.retain) {
          index += op.retain;
        } else if (op.insert) {
          const text = op.insert;
          const pos = doc.posFromIndex(index);
          doc.replaceRange(text, pos, pos, '*remote');
          index += text.length;
        } else if (op.delete) {
          const len = op.delete;
          const startPos = doc.posFromIndex(index);
          const endPos = doc.posFromIndex(index + len);
          doc.replaceRange('', startPos, endPos, '*remote');
        }
      });
    }, 'remote');

    this.isApplying = false;
  }
}

// DOM refs
const submitSolutionBtn = document.getElementById('submitSolutionBtn');
const timerEl = document.getElementById('timer');
const problemTitle = document.getElementById('problemTitle');
const problemDesc = document.getElementById('problemDescription');
const difficultyEl = document.getElementById('difficultyBadge');
const historyGrid = document.getElementById('historyGrid');

const battleLobby = document.getElementById('battle-lobby');
const activeBattle = document.getElementById('active-battle');
const solutionCode = document.getElementById('solutionCode');

// New DOM refs
const findMatchBtn = document.getElementById('findMatchBtn');
const difficultySelect = document.getElementById('difficultySelect');
const matchmakingStatus = document.getElementById('matchmakingStatus');
const myUsernameDisplay = document.getElementById('myUsernameDisplay');
const opponentNameDisplay = document.getElementById('opponentNameDisplay');
const myProgressBar = document.getElementById('myProgressBar');
const opponentProgressBar = document.getElementById('opponentProgressBar');
const myProgressText = document.getElementById('myProgressText');
const opponentProgressText = document.getElementById('opponentProgressText');
const submitStatusMsg = document.getElementById('submitStatusMsg');

// Spectator
const spectatorModal = document.getElementById('spectatorModal');
const closeSpectatorBtn = document.getElementById('closeSpectatorBtn');

// ─── Authenticated fetch ───
async function apiFetch(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ─── Init ───
async function init() {
  try {
    let { authenticated, user } = await apiFetch('/session').catch(() => ({
      authenticated: false,
      user: null,
    }));
    if (!authenticated || !user) {
      // Mock user for direct access without login
      authenticated = true;
      user = {
        sub: 'guest-' + Math.floor(Math.random() * 10000),
        name: 'Guest User',
        email: 'guest@example.com',
      };
    }
    currentUserId = user.sub;
    currentUserName = user.name || user.email;
    initSocket();
    await loadHistory().catch(() => console.warn('Failed to load history (requires Firestore)'));
  } catch (err) {
    console.error('Session check failed:', err.message);
  }
}

function initSocket() {
  if (typeof window.io !== 'undefined') {
    socket = window.io();

    socket.on('match-found', (data) => {
      currentBattleId = data.battleId;
      const battle = data.battleData;
      const oppName = data.opponentName[currentUserId];

      // Update UI
      if (matchmakingStatus) matchmakingStatus.style.display = 'none';
      if (findMatchBtn) findMatchBtn.disabled = false;

      battleLobby.style.display = 'none';
      activeBattle.style.display = 'block';

      if (problemTitle) problemTitle.textContent = battle.problemTitle;
      if (problemDesc) problemDesc.textContent = battle.problemDescription;
      if (difficultyEl) difficultyEl.textContent = battle.difficulty;

      if (myUsernameDisplay) myUsernameDisplay.textContent = currentUserName;
      if (opponentNameDisplay) opponentNameDisplay.textContent = oppName;

      if (myProgressBar) myProgressBar.style.width = '0%';
      if (opponentProgressBar) opponentProgressBar.style.width = '0%';
      if (myProgressText) myProgressText.textContent = '0%';
      if (opponentProgressText) opponentProgressText.textContent = '0%';
      if (submitStatusMsg) submitStatusMsg.textContent = '';

      // Initialize CodeMirror and bind Yjs
      if (solutionCode) {
        if (!editor) {
          editor = CodeMirror.fromTextArea(solutionCode, {
            mode: 'javascript',
            theme: 'dracula',
            lineNumbers: true,
            matchBrackets: true,
            indentUnit: 4,
            lineWrapping: true,
          });
          editor.setSize('100%', '450px'); // Ensure height fits the panel layout

          // Hook CodeMirror change event to WPM & telemetry updates
          editor.on('change', (instance, changeObj) => {
            if (changeObj.origin === '*remote' || changeObj.origin === 'setValue') {
              return;
            }
            onEditorInput();
          });

          // Hook cursor change event to sync position
          editor.on('cursorActivity', () => {
            if (!currentBattleId || !socket) return;
            const doc = editor.getDoc();
            const anchor = doc.getCursor('anchor');
            const head = doc.getCursor('head');
            socket.emit('battle-cursor-update', {
              battleId: currentBattleId,
              userId: currentUserId,
              position: { anchor, head },
            });
          });
        }

        // Reset and create fresh Yjs document
        if (ydoc) ydoc.destroy();
        ydoc = new Y.Doc();
        ytext = ydoc.getText('codemirror');
        ybinding = new YCodeMirrorBinding(ytext, editor);

        // Bind update listener to serialize and emit deltas
        ydoc.on('update', (update, origin) => {
          if (origin === 'local' || origin === null) {
            const base64Update = uint8ArrayToBase64(update);
            socket.emit('battle-code-update', {
              battleId: currentBattleId,
              userId: currentUserId,
              update: base64Update,
            });
          }
        });

        editor.setOption('readOnly', false);
      }

      // Explicitly register with the server for battle updates
      socket.emit('battle-join', {
        battleId: currentBattleId,
        userId: currentUserId,
      });

      if (submitSolutionBtn) submitSolutionBtn.disabled = false;

      // Reset Telemetry card UI elements
      const oppTypingPulse = document.getElementById('oppTypingPulse');
      const oppTypingText = document.getElementById('oppTypingText');
      const oppStatusDot = document.getElementById('oppStatusDot');
      const oppWpmText = document.getElementById('oppWpmText');
      const oppCharCount = document.getElementById('oppCharCount');
      const oppSyntaxErrors = document.getElementById('oppSyntaxErrors');
      const oppTestGrid = document.getElementById('oppTestGrid');
      const oppTestAlertText = document.getElementById('oppTestAlertText');
      const oppAlertBanner = document.getElementById('oppAlertBanner');
      const localTestGridContainer = document.getElementById('localTestGridContainer');

      if (oppTypingPulse) {
        oppTypingPulse.classList.remove('typing');
        oppTypingPulse.style.background = '#94a3b8';
      }
      if (oppTypingText) {
        oppTypingText.textContent = 'Idle';
        oppTypingText.style.color = 'var(--text-muted)';
      }
      if (oppStatusDot) oppStatusDot.style.background = '#94a3b8';
      if (oppWpmText) oppWpmText.textContent = '0 WPM';
      if (oppCharCount) oppCharCount.textContent = '0';
      if (oppSyntaxErrors) {
        oppSyntaxErrors.textContent = 'Pass';
        oppSyntaxErrors.style.color = '#22c55e';
      }
      if (oppTestGrid) {
        oppTestGrid.innerHTML = `
          <i class="far fa-circle" style="color: #475569;"></i>
          <i class="far fa-circle" style="color: #475569;"></i>
          <i class="far fa-circle" style="color: #475569;"></i>
          <i class="far fa-circle" style="color: #475569;"></i>
          <i class="far fa-circle" style="color: #475569;"></i>
        `;
      }
      if (oppTestAlertText) {
        oppTestAlertText.textContent = 'No runs yet';
        oppTestAlertText.style.color = 'var(--text-muted)';
      }
      if (oppAlertBanner) oppAlertBanner.style.display = 'none';
      if (localTestGridContainer) localTestGridContainer.style.display = 'none';

      // Reset local states
      isTyping = false;
      battleStartTime = Date.now();
      if (typingTimeout) clearTimeout(typingTimeout);
      if (stateDebounceTimeout) clearTimeout(stateDebounceTimeout);

      // Start client side timer (5 mins)
      let timeLeft = 300;
      if (timerEl) timerEl.textContent = timeLeft;

      stopPolling(); // we use socket now, but keep interval for timer
      pollInterval = setInterval(() => {
        timeLeft--;
        if (timerEl) timerEl.textContent = Math.max(0, timeLeft);
        if (timeLeft <= 0) {
          stopPolling();
          submitStatusMsg.textContent = "Time's up!";
          submitSolutionBtn.disabled = true;
          if (editor) editor.setOption('readOnly', true);
          else solutionCode.disabled = true;
        }
      }, 1000);
    });

    socket.on('battle-progress-update', (data) => {
      if (data.userId === currentUserId) {
        if (myProgressBar) myProgressBar.style.width = data.progress + '%';
        if (myProgressText) myProgressText.textContent = data.progress + '%';
      } else {
        if (opponentProgressBar) opponentProgressBar.style.width = data.progress + '%';
        if (opponentProgressText) opponentProgressText.textContent = data.progress + '%';
      }
    });

    socket.on('battle-over', (data) => {
      stopPolling();
      submitSolutionBtn.disabled = true;
      if (editor) editor.setOption('readOnly', true);
      else solutionCode.disabled = true;

      const isWinner = data.winnerId === currentUserId;
      if (isWinner) {
        submitStatusMsg.style.color = '#22c55e';
        submitStatusMsg.textContent = `🏆 You won the battle! Earned ${data.xpAwarded} XP and the '${data.badge}' badge!`;

        // Update LocalStorage
        const up = JSON.parse(localStorage.getItem('algoInfinityVerse') || '{}');
        up.battlesWon = (up.battlesWon || 0) + 1;
        up.xp = (up.xp || 0) + data.xpAwarded;
        if (!up.badges) up.badges = [];
        if (!up.badges.includes(data.badge)) up.badges.push(data.badge);
        localStorage.setItem('algoInfinityVerse', JSON.stringify(up));
      } else {
        submitStatusMsg.style.color = '#ef4444';
        submitStatusMsg.textContent = `❌ ${data.winnerName} won the battle!`;
      }

      setTimeout(() => {
        alert(submitStatusMsg.textContent);
        location.reload();
      }, 3000);
    });

    socket.on('battle-submit-result', (data) => {
      if (!data.success) {
        submitStatusMsg.style.color = '#ef4444';
        submitStatusMsg.textContent = data.message || data.error || 'Submission failed.';
        submitSolutionBtn.disabled = false;
        submitSolutionBtn.textContent = 'Submit Solution';

        // Render local player's test-case grid
        if (data.results) {
          renderTestGrid('myTestGrid', data.results);
          const gridContainer = document.getElementById('localTestGridContainer');
          if (gridContainer) gridContainer.style.display = 'flex';
        }
      }
    });

    // ── Collaborative CRDT Sync Receivers ──
    socket.on('battle-init-state', (data) => {
      if (data && data.updates && ydoc) {
        ydoc.transact(() => {
          data.updates.forEach((updateBase64) => {
            const update = base64ToUint8Array(updateBase64);
            Y.applyUpdate(ydoc, update, 'remote');
          });
        }, 'remote');
      }
    });

    socket.on('battle-code-update', (data) => {
      if (data.userId === currentUserId) return;
      if (ydoc && data.update) {
        const update = base64ToUint8Array(data.update);
        Y.applyUpdate(ydoc, update, 'remote');
      }
    });

    socket.on('battle-cursor-update', (data) => {
      if (data.userId === currentUserId) return;
      if (editor && data.position) {
        const { anchor, head } = data.position;
        const color = '#3b82f6'; // Blue remote cursor
        const name = opponentNameDisplay ? opponentNameDisplay.textContent : 'Opponent';

        // Clear previous cursor/selection
        if (remoteCursors.has(data.userId)) {
          const prev = remoteCursors.get(data.userId);
          prev.cursor?.clear();
          prev.selection?.clear();
          clearTimeout(prev.nameTimeout);
        }

        // Draw selection range if anchor and head differ
        let selectionMark = null;
        const hasSelection = anchor.line !== head.line || anchor.ch !== head.ch;
        if (hasSelection) {
          selectionMark = editor.markText(anchor, head, {
            className: 'opponent-selection',
          });
        }

        // Create remote cursor element
        const cursorEl = document.createElement('div');
        cursorEl.className = 'remote-cursor-widget';
        cursorEl.setAttribute('aria-hidden', 'true');
        cursorEl.style.borderColor = color;
        cursorEl.style.height = '1.2em';

        const nameEl = document.createElement('div');
        nameEl.className = 'remote-cursor-name';
        nameEl.style.backgroundColor = color;
        nameEl.textContent = name;
        cursorEl.appendChild(nameEl);

        let nameTimeout = setTimeout(() => {
          nameEl.style.display = 'none';
        }, 2000);

        const cursorBookmark = editor.setBookmark(head, { widget: cursorEl, insertLeft: true });

        remoteCursors.set(data.userId, {
          cursor: cursorBookmark,
          selection: selectionMark,
          nameTimeout,
        });
      }
    });

    socket.on('battle-user-left', (data) => {
      if (remoteCursors.has(data.userId)) {
        const prev = remoteCursors.get(data.userId);
        prev.cursor?.clear();
        prev.selection?.clear();
        clearTimeout(prev.nameTimeout);
        remoteCursors.delete(data.userId);
      }
    });

    // ── Live Telemetry Receivers ──
    socket.on('opponent:typing', (data) => {
      if (data.userId === currentUserId) return;
      const pulse = document.getElementById('oppTypingPulse');
      const text = document.getElementById('oppTypingText');
      const dot = document.getElementById('oppStatusDot');
      if (data.typing) {
        if (pulse) {
          pulse.classList.add('typing');
          pulse.style.background = '#eab308';
        }
        if (text) {
          text.textContent = 'Typing...';
          text.style.color = '#eab308';
        }
        if (dot) dot.style.background = '#eab308';
      } else {
        if (pulse) {
          pulse.classList.remove('typing');
          pulse.style.background = '#94a3b8';
        }
        if (text) {
          text.textContent = 'Idle';
          text.style.color = 'var(--text-muted)';
        }
        if (dot) dot.style.background = '#ef4444';
      }
    });

    socket.on('opponent:editor-state', (data) => {
      if (data.userId === currentUserId) return;
      const wpmEl = document.getElementById('oppWpmText');
      const charsEl = document.getElementById('oppCharCount');
      const syntaxEl = document.getElementById('oppSyntaxErrors');

      if (wpmEl) wpmEl.textContent = `${data.wpm} WPM`;
      if (charsEl) charsEl.textContent = data.charCount;
      if (syntaxEl) {
        if (data.syntaxErrors > 0) {
          syntaxEl.textContent = 'Error';
          syntaxEl.style.color = '#ef4444';
        } else {
          syntaxEl.textContent = 'Pass';
          syntaxEl.style.color = '#22c55e';
        }
      }
    });

    socket.on('opponent:test-run', (data) => {
      if (data.userId === currentUserId) return;
      const results = data.results || [];
      renderTestGrid('oppTestGrid', results);

      const allPassed = results.length > 0 && results.every((r) => r === true);
      const alertText = document.getElementById('oppTestAlertText');
      const banner = document.getElementById('oppAlertBanner');
      const telCard = document.querySelector('.telemetry-card');

      // Shake effect
      if (telCard) {
        telCard.classList.remove('shake');
        void telCard.offsetWidth; // trigger reflow
        telCard.classList.add('shake');
      }

      if (allPassed) {
        SoundSynth.playSuccess();
        if (alertText) {
          alertText.textContent = 'All test cases passed!';
          alertText.style.color = '#22c55e';
        }
        if (banner) {
          banner.textContent = '🎉 Opponent passed all tests!';
          banner.style.background = '#064e3b';
          banner.style.color = '#6ee7b7';
          banner.style.display = 'block';
        }
        if (telCard) {
          telCard.classList.remove('border-flash-red');
          telCard.classList.add('border-flash-green');
        }
      } else {
        SoundSynth.playFailure();
        const passedCount = results.filter(Boolean).length;
        if (alertText) {
          alertText.textContent = `Passed ${passedCount}/${results.length} tests`;
          alertText.style.color = '#ef4444';
        }
        if (banner) {
          banner.textContent = '⚠️ Opponent failed some tests!';
          banner.style.background = '#7f1d1d';
          banner.style.color = '#fca5a5';
          banner.style.display = 'block';
        }
        if (telCard) {
          telCard.classList.remove('border-flash-green');
          telCard.classList.add('border-flash-red');
        }
      }

      setTimeout(() => {
        if (telCard) {
          telCard.classList.remove('border-flash-red', 'border-flash-green');
        }
        if (banner) banner.style.display = 'none';
      }, 3000);
    });
  }
}

// ─── Polling ───
function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

// ─── Actions ───
if (findMatchBtn) {
  findMatchBtn.addEventListener('click', () => {
    if (!socket) return alert('Disconnected from server.');
    const difficulty = difficultySelect?.value || 'Medium';

    findMatchBtn.disabled = true;
    if (matchmakingStatus) matchmakingStatus.style.display = 'block';

    socket.emit('find-match', {
      userId: currentUserId,
      userName: currentUserName,
      difficulty,
    });
  });
}

if (submitSolutionBtn) {
  submitSolutionBtn.addEventListener('click', () => {
    if (!currentBattleId || !socket) return;
    const code = editor ? editor.getValue() : solutionCode.value || '';
    if (!code.trim()) return;

    submitSolutionBtn.disabled = true;
    submitSolutionBtn.textContent = 'Submitting...';
    if (submitStatusMsg) {
      submitStatusMsg.style.color = '#eab308';
      submitStatusMsg.textContent = 'Running tests...';
    }

    socket.emit('battle-submit', {
      battleId: currentBattleId,
      userId: currentUserId,
      code,
    });
  });
}

// ─── Real-time typing logic ───
function onEditorInput() {
  if (!currentBattleId || !socket) return;

  // Play tactile keystroke feedback sound
  SoundSynth.playKeystroke();

  // Initialize start time on first keystroke if not already set
  if (!battleStartTime) {
    battleStartTime = Date.now();
  }

  // Typing Status Emission
  if (!isTyping) {
    isTyping = true;
    socket.emit('battle-typing', {
      battleId: currentBattleId,
      userId: currentUserId,
      typing: true,
    });
  }

  if (typingTimeout) clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    isTyping = false;
    socket.emit('battle-typing', {
      battleId: currentBattleId,
      userId: currentUserId,
      typing: false,
    });
  }, 1500);

  const code = editor ? editor.getValue() : solutionCode.value || '';

  // Progress broadcast (mock progress update based on line counts)
  const lines = code.split('\n').length;
  const progress = Math.min(100, lines * 5);
  socket.emit('battle-progress-update', {
    battleId: currentBattleId,
    userId: currentUserId,
    progress,
  });
  if (myProgressBar) myProgressBar.style.width = progress + '%';
  if (myProgressText) myProgressText.textContent = progress + '%';

  // Debounce Editor State updates (WPM, Chars, Syntax)
  if (stateDebounceTimeout) clearTimeout(stateDebounceTimeout);
  stateDebounceTimeout = setTimeout(() => {
    const codeVal = editor ? editor.getValue() : solutionCode.value || '';
    const charCount = codeVal.length;

    // Syntax checking
    let syntaxErrors = 0;
    try {
      new Function(codeVal);
    } catch (e) {
      syntaxErrors = 1;
    }

    // WPM calculations
    const wordCount = codeVal.split(/\s+/).filter((w) => w.length > 0).length;
    const elapsedMins = (Date.now() - battleStartTime) / 60000;
    const wpm = Math.round(wordCount / Math.max(0.1, elapsedMins));

    socket.emit('battle-editor-state', {
      battleId: currentBattleId,
      userId: currentUserId,
      charCount,
      syntaxErrors,
      wpm,
    });
  }, 1000);
}

if (solutionCode) {
  solutionCode.addEventListener('input', onEditorInput);
}

// Spectator
if (closeSpectatorBtn) {
  closeSpectatorBtn.addEventListener('click', () => {
    if (spectatorModal) spectatorModal.style.display = 'none';
  });
}

async function loadHistory() {
  try {
    const { history } = await apiFetch('/battles/history');
    if (!historyGrid) return;
    if (!history?.length) {
      historyGrid.innerHTML = '<p style="color:#94a3b8;text-align:center">No battles yet.</p>';
      return;
    }
    historyGrid.innerHTML = history
      .map((b) => {
        const iWon = currentUserId && b.winner === currentUserId;
        const isDraw = b.status === 'expired' && !b.winner;
        const result = isDraw ? 'Draw' : iWon ? 'Victory' : 'Defeat';
        const xp = iWon ? b.xpAwarded : 0;
        const date = b.createdAt?._seconds
          ? new Date(b.createdAt._seconds * 1000).toLocaleDateString()
          : '—';
        return `<div class="history-card">
          <h3>${result}</h3>
          <p>${b.problemTitle || 'Unknown Problem'}</p>
          <p>${b.difficulty} • ${xp} XP</p>
          <p>${date}</p>
        </div>`;
      })
      .join('');
  } catch (err) {
    console.warn('History loading failed:', err);
  }
}

function renderTestGrid(elementId, results) {
  const container = document.getElementById(elementId);
  if (!container) return;
  container.innerHTML = results
    .map((passed) => {
      if (passed) {
        return '<i class="fas fa-circle-check" style="color: #22c55e; margin-right: 4px;"></i>';
      } else {
        return '<i class="fas fa-circle-xmark" style="color: #ef4444; margin-right: 4px;"></i>';
      }
    })
    .join('');
}

// Web Audio API Audio Synthesizer
const SoundSynth = {
  ctx: null,
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },
  playSuccess() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
    osc.frequency.setValueAtTime(1046.5, now + 0.3); // C6

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.start(now);
    osc.stop(now + 0.6);
  },
  playFailure() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(120, now + 0.4);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.start(now);
    osc.stop(now + 0.5);
  },
  playKeystroke() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);

    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.start(now);
    osc.stop(now + 0.05);
  },
};

document.addEventListener('DOMContentLoaded', init);
